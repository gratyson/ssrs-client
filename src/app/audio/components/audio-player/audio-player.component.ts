import { Component, ElementRef, Input, SimpleChanges, ViewChild, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AudioClient } from "../../../client/audio-client";
import { getAudioMimeType } from "../../../util/audio-util";

@Component({
    selector: "word-audio-player",
    templateUrl: "audio-player.html",
    styleUrl: "audio-player.css",
    imports: [MatIconModule, MatButtonModule]
})
export class AudioPlayerComponent {

    @ViewChild("audioPlayer") audioPlayer: ElementRef<HTMLAudioElement>;

    private audioClient: AudioClient = inject(AudioClient);
    
    @Input() wordId: string;
    @Input() audioFileName: string;

    audioFilePath: string;
    audioMimeType: string;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (this.wordId && this.audioFileName) {
            this.audioClient.getAudioPath(this.audioFileName).subscribe(path => {
                this.setAudio(path);
            });
        }
    }

    public playAudio(): void {
        this.pauseAudio();

        if (this.audioPlayer) {
            this.audioPlayer.nativeElement.currentTime = 0;
            this.audioPlayer.nativeElement.play();
        }
    }

    public stopAudio(): void {
        if (this.audioPlayer) {
            this.pauseAudio();
            this.audioPlayer.nativeElement.currentTime = 0;
        }
    }

    private pauseAudio(): void {
        console.dir(this.audioPlayer);
        if(this.audioPlayer && (!this.audioPlayer.nativeElement.paused && !this.audioPlayer.nativeElement.ended)) {
            this.audioPlayer.nativeElement.pause();
        }
    }

    private setAudio(audioPath: string) {
        if (this.audioFilePath != audioPath) {
            this.audioFilePath = audioPath;
            this.audioMimeType = getAudioMimeType(this.audioFileName);
        }
    }
}