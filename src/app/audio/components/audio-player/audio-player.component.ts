import { Component, ElementRef, Input, SimpleChange, SimpleChanges, ViewChild, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AudioClient } from "../../../client/audio-client";

@Component({
    selector: "word-audio-player",
    standalone: true,
    templateUrl: "audio-player.html",
    styleUrl: "audio-player.css",
    imports: [ MatIconModule, MatButtonModule ]
})
export class AudioPlayerComponent {

    @ViewChild("audioPlayer") audioPlayer : ElementRef<HTMLAudioElement>;

    private audioClient: AudioClient = inject(AudioClient);
    
    @Input() wordId: string;
    @Input() audioFileName: string;
    @Input() hidden: boolean = false;

    audioFilePath: string;
    audioMimeType: string;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("wordId") || simpleChanges.hasOwnProperty("audioFileName")) {
            if (this.wordId && this.audioFileName) {
                if(this.audioPlayer && (!this.audioPlayer.nativeElement.paused && !this.audioPlayer.nativeElement.ended)) {
                    this.audioPlayer.nativeElement.pause();
                }
                this.audioFilePath = this.audioClient.getAudioPath(this.wordId, this.audioFileName);
                this.audioMimeType = "audio/" + this.audioFileName.substring(this.audioFileName.lastIndexOf(".") + 1);
            }
        } 3
    }

    public playAudio(): void {
        this.audioPlayer.nativeElement.currentTime = 0;
        this.audioPlayer.nativeElement.play();
    }
}