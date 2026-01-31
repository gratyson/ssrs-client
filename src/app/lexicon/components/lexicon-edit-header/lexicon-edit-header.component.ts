import { Component, EventEmitter, Input, Output, SimpleChanges, inject } from "@angular/core";
import { LexiconMetadata } from "../../model/lexicon";
import { MatMenuModule } from '@angular/material/menu'; 
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from "@angular/material/form-field";
import { LexiconClient } from "../../../client/lexicon-client";
import { RouterLink } from "@angular/router";

@Component({
    selector: "lexicon-edit-header",
    templateUrl: "lexicon-edit-header.html",
    styleUrl: "lexicon-edit-header.css",
    providers: [LexiconClient],
    imports: [MatMenuModule, MatIconModule, MatButtonModule, MatFormFieldModule, RouterLink]
})
export class LexiconEditHeaderComponent {
    private lexiconClient: LexiconClient = inject(LexiconClient);

    @Input() lexiconMetadata: LexiconMetadata; 
    lexiconImagePath: string;

    @Output() loadWordsFromFile: EventEmitter<File> = new EventEmitter<File>();
    @Output() loadAudioFromFiles: EventEmitter<FileList> = new EventEmitter<FileList>();
    @Output() deleteLexicon: EventEmitter<void> = new EventEmitter<void>();
    @Output() editLexiconMetadata: EventEmitter<void> = new EventEmitter<void>();
    @Output() exportLexicon: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() adjustNextReviewTime: EventEmitter<void> = new EventEmitter<void>()

    @Output() unimplementedOption = new EventEmitter();

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty("lexiconMetadata")) {
            this.lexiconImagePath = this.lexiconClient.getImagePath(this.lexiconMetadata);
        }
    }

    onEditLexiconMetadatClick(): void {
        this.editLexiconMetadata.emit();
    }

    onLoadWordsFromFile(): void {
        this.loadWordsFromFile.emit();
    }

    onExportWords(includeHistory: boolean): void {
        this.exportLexicon.emit(includeHistory);
    }

    onDeleteLexiconClick(): void {
        this.deleteLexicon.emit();
    }

    onUnimplemented() {
        this.unimplementedOption.emit();
    }

    onWordFileSelected(event: Event) {
        if (event != null && event.target != null) {
            const inputElement = event.target as HTMLInputElement;
            if (inputElement.files != null && inputElement.files.length > 0) {
                this.loadWordsFromFile.emit(inputElement.files[0]);
            }
            inputElement.value = "";
        }
    }

    onAudioFilesSelected(event: Event) {
        if (event != null && event.target != null) {
            const inputElement = event.target as HTMLInputElement;
            if (inputElement.files != null && inputElement.files.length > 0) {
                this.loadAudioFromFiles.emit(inputElement.files);
            }
            
        }
    }

    onAdjustNextReviewTime() {
        this.adjustNextReviewTime.emit();
    }
}