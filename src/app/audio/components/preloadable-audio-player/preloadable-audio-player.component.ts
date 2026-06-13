import { Component, ElementRef, inject, QueryList, ViewChildren } from "@angular/core";
import { AudioClient } from "../../../client/audio-client";
import { getAudioMimeType } from "../../../util/audio-util";

const PLAYER_COUNT: number = 3;

/**
 * The generally goal is for audio during review sessions to be played fully without interupting the pace of review. 
 * This means that the audio should continue to play even after the user continues to the next test, and should only
 * be interrupted if anther audio entry needs to be played.
 *
 * This could be done simply by setting the new audio immediately before playing it, but that can add additional 
 * latency depending on  the user's connection. Instead, this class maintains multiple audio elements, and allows 
 * for the the previous test's audio to continue to play while the current test's audio is preloaded. 
 */
@Component({
    selector: "preloadable-audio-player",
    templateUrl: "preloadable-audio-player.html",
    styleUrl: "preloadable-audio-player.css"
})
export class PreloadableAudioPlayerComponent {
    
    private audioClient: AudioClient = inject(AudioClient);

    @ViewChildren("audioPlayer") audioPlayers: QueryList<ElementRef<HTMLAudioElement>>;

    audioFilePaths: string[] = new Array(PLAYER_COUNT).fill("");
    audioMimeTypes: string[] = new Array(PLAYER_COUNT).fill("");
    audioFileNames: string[] = new Array(PLAYER_COUNT).fill("");
    audioFileNameIndex: { [k:string]: number } = {};

    mostRecentlyUsedQueue: number[] = [];
    
    playOnLoad: string = "";

    public ngOnInit(): void {

    }

    public preloadAudio(audioFileName: string, autoplay: boolean = false): void {
        if (autoplay) {
            this.playOnLoad = audioFileName;
        }
        
        if (this.audioFileNameIndex.hasOwnProperty(audioFileName)) {
            this.markExistingAsMRU(this.audioFileNameIndex[audioFileName]);
        } else {
            this.audioClient.getAudioPath(audioFileName).subscribe(path => {
                const newIdx: number = this.getIndexForNewAudio();
                
                const oldAudioFileName = this.audioFileNames[newIdx];
                delete this.audioFileNameIndex[oldAudioFileName];

                this.audioFilePaths[newIdx] = path;
                this.audioMimeTypes[newIdx] = getAudioMimeType(audioFileName);
                this.audioFileNames[newIdx] = audioFileName;
                this.audioFileNameIndex[audioFileName] = newIdx;
            });
        }
    }

    public playAudio(audioFileName: string): void {
        if (!this.audioFileNameIndex.hasOwnProperty(audioFileName)) {
            this.preloadAudio(audioFileName);
        }

        this.pausePlayingAudio();
        const audioPlayer = this.getAudioPlayer(this.audioFileNameIndex[audioFileName]);
        audioPlayer.nativeElement.currentTime = 0;
        audioPlayer.nativeElement.play();
    }

    public stopAudio(): void {
        this.pausePlayingAudio();
    }

    onCanPlay(index: number) {
        if (this.playOnLoad && this.audioFileNameIndex[this.playOnLoad] === index) {
            this.playAudio(this.playOnLoad);
            this.playOnLoad = "";
        }
    }

    private pausePlayingAudio() {
        for (let audioPlayer of this.audioPlayers?.toArray()) {
            if (!audioPlayer.nativeElement.paused) {
                audioPlayer.nativeElement.pause();
            }
        }
    }

    private getAudioPlayer(index: number): ElementRef<HTMLAudioElement> {
        return this.audioPlayers?.toArray()[index];
    }

    private getIndexForNewAudio(): number {
        let idxToUse: number;
        
        if (this.mostRecentlyUsedQueue.length < PLAYER_COUNT) {
            idxToUse = this.mostRecentlyUsedQueue.length;
        } else {
            idxToUse = this.mostRecentlyUsedQueue.pop() || 0;    // .pop is number | undefined, so using || 0, but it never should be undefined in this block
        }

        this.mostRecentlyUsedQueue.unshift(idxToUse);
        return idxToUse;
    }

    private markExistingAsMRU(index: number) {        
        for (let mruIdx = 0; mruIdx < PLAYER_COUNT; mruIdx++) {
            if (this.mostRecentlyUsedQueue[mruIdx] === index) {
                this.mostRecentlyUsedQueue.splice(mruIdx);
                this.mostRecentlyUsedQueue.unshift(index);

                break;
            }
        }
    }
}