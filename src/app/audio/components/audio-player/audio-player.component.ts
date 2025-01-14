import { Component, ElementRef, Input, QueryList, SimpleChanges, ViewChildren, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AudioClient } from "../../../client/audio-client";

/**
 * The generally goal is for audio to be played fully without interupting the pace of review. This means that the audio should
 * continue to play even after the user continues to the next test, and should only be interrupted if anther audio
 * entry needs to be played.
 *
 * This could be done simply by setting the new audio after a test is complete, but that can add additional latency depending on 
 * the user's connection. Instead, this class maintains two audio elements, and allows for the the previous test's audio to
 * continue to play while the current test's audio is preloaded. The two elements can then alternately be used for 
 * preloading/playing audio as the user progresses through the tests
 */
@Component({
    selector: "word-audio-player",
    standalone: true,
    templateUrl: "audio-player.html",
    styleUrl: "audio-player.css",
    imports: [ MatIconModule, MatButtonModule ]
})
export class AudioPlayerComponent {

    @ViewChildren("audioPlayer") audioPlayers: QueryList<ElementRef<HTMLAudioElement>>;

    private audioClient: AudioClient = inject(AudioClient);
    
    @Input() wordId: string;
    @Input() audioFileName: string;
    @Input() hidden: boolean = false;
    @Input() autoplay: boolean = false;
    @Input() preload: boolean = false;

    audioFilePath: string[] = ["", ""];
    audioMimeType: string[] = ["", ""];
    hasAutoplayStarted: boolean = false;

    private activePlayerIdx: number = 0;
    private preloadedActive: boolean = false;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (this.wordId && this.audioFileName) {
            if (!this.preload) {
                this.pauseAudio();
            }

            const newAudioFilePath = this.audioClient.getAudioPath(this.wordId, this.audioFileName);
            this.setAudio(newAudioFilePath, this.preload);

            this.preloadedActive = false;
            this.hasAutoplayStarted = false;
        }
    }

    public playAudio(): void {
        this.pauseAudio();

        if (this.preload && !this.preloadedActive) {
            this.swapActiveAudioPlayer();
            this.preloadedActive = true;
        }

        const activePlayer = this.getActiveAudioPlayer();
        if (activePlayer) {
            activePlayer.nativeElement.currentTime = 0;
            activePlayer.nativeElement.play();
        }
    }

    public stopAudio(): void {
        const activePlayer = this.getActiveAudioPlayer();
        if (activePlayer) {
            this.pauseAudio();
            activePlayer.nativeElement.currentTime = 0;
        }
    }

    onCanPlay(): void {
        this.autoPlayAudio();
    }

    private autoPlayAudio(): void {
        if (this.autoplay && !this.hasAutoplayStarted) {
            this.hasAutoplayStarted = true;
            this.playAudio();
        }
    }

    private pauseAudio(): void {
        const activePlayer: ElementRef<HTMLAudioElement> = this.getActiveAudioPlayer();
        if(activePlayer && (!activePlayer.nativeElement.paused && !activePlayer.nativeElement.ended)) {
            activePlayer.nativeElement.pause();
        }
    }

    private getActiveAudioPlayer(): ElementRef<HTMLAudioElement> {
        return this.audioPlayers?.toArray()[this.activePlayerIdx];
    }

    private swapActiveAudioPlayer(): void {
        this.activePlayerIdx = (this.activePlayerIdx + 1) % 2;
    }

    private setAudio(audioPath: string, preload: boolean) {
        const audioIdx = preload ? (this.activePlayerIdx + 1) % 2 : this.activePlayerIdx;
        if (this.audioFilePath[audioIdx] != audioPath) {
            this.audioFilePath[audioIdx] = audioPath;
            this.audioMimeType[audioIdx] = "audio/" + this.audioFileName.substring(this.audioFileName.lastIndexOf(".") + 1);
        } else if (this.autoplay) {
            this.playAudio();
        }
    }
}