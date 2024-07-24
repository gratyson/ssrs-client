import { Component, ElementRef, EventEmitter, Inject, Output, ViewChild, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { Word } from "../../../lexicon/model/word";
import { AudioClient } from "../../../client/audio-client";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AudioPlayerComponent } from "../audio-player/audio-player.component";

@Component({
    selector: "audio-edit-dialog",
    templateUrl: "audio-edit-dialog.html",
    styleUrl: "audio-edit-dialog.css",
    standalone: true,
    imports: [ MatIconModule, MatButtonModule, AudioPlayerComponent, MatDividerModule ]
})
export class AudioEditDialogComponent {

    private audioClient: AudioClient = inject(AudioClient);

    constructor(public dialogRef: MatDialogRef<AudioEditDialogComponent>,
                @Inject(MAT_DIALOG_DATA) dialogData: AudioEditDialogData) {
        this.wordId = dialogData.word.id;
        this.audioFileNames = dialogData.word.audioFiles;
        this.parentRef = dialogData.parentRef;
    }

    wordId: string;
    parentRef: ElementRef;
    audioFileNames: string[] = [];

    @Output() onAudioChanged: EventEmitter<string[]> = new EventEmitter<string[]>();

    @ViewChild("dialogContainer") dialogContainer: ElementRef;

    public ngAfterViewInit(): void {
        this.positionWindow();
    }
    
    onResize(event: Event): void {
        this.positionWindow();
    }

    onAudioFileSelected(event: Event): void {
        if (event != null && event.target != null) {
            const inputElement = event.target as HTMLInputElement;
            if (inputElement.files != null && inputElement.files.length > 0) {
                const newAudioFile: File = inputElement.files[0];
                this.audioClient.saveAudio(this.wordId, newAudioFile).subscribe(newId => this.addAudioFilePath(newId));
            }
        }
    }

    addAudioFilePath(audioFileName: string) {
        if (audioFileName) {
            this.audioFileNames.push(audioFileName);
            this.onAudioChanged.emit(this.audioFileNames);
        }
    }

    positionWindow(): void {
        if (this.dialogContainer != undefined) {
            const parentRect: DOMRect = this.parentRef.nativeElement.getBoundingClientRect();
            const dialogRect: DOMRect = this.dialogContainer.nativeElement.getBoundingClientRect();
            
            const right = window.innerWidth - parentRect.left + 5;
            if (parentRect.top + dialogRect.height < window.innerHeight) {
                this.dialogRef.updatePosition({ top: `${parentRect.top}px`, right: `${right}px` });
            } else {
                this.dialogRef.updatePosition({ bottom: `${window.innerHeight - parentRect.bottom}px`, right: `${right}px` });
            }
        }
    }
    
    deleteAudioFile(audioFileNameIndex: number): void {
        this.audioClient.deleteAudio(this.wordId, this.audioFileNames[audioFileNameIndex]).subscribe((result) => {
            if (result) {
                this.audioFileNames.splice(audioFileNameIndex, 1); 
                this.onAudioChanged.emit(this.audioFileNames);
            }
        });
    }
}

export class AudioEditDialogData {
    word: Word;
    parentRef: ElementRef;

    constructor(word: Word, parentRef: ElementRef) {
        this.word = word;
        this.parentRef = parentRef;
    }
}