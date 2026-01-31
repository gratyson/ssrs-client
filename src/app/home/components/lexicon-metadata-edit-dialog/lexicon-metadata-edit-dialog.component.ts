import { Component, Inject, Input, inject } from "@angular/core";
import { LexiconMetadata } from "../../../lexicon/model/lexicon";
import { LexiconClient } from "../../../client/lexicon-client";
import { MatGridListModule } from '@angular/material/grid-list'; 
import { FormsModule } from "@angular/forms";
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Language } from "../../../language/language";
import { LanguageService } from "../../../language/language-service";
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from "@angular/material/icon"; 
import { MatButtonModule } from "@angular/material/button";
import {
    MatDialog,
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  } from '@angular/material/dialog';

const NEW_LEXICON_FORM_TITLE: string = "Create Lexicon";
const UPDATE_LEXICON_FORM_TITLE: string = "Update Lexicon";

const MAX_IMAGE_FILE_SIZE: number = 1024 * 1024;

@Component({
    selector: "lexicon-metadata-edit-dialog",
    templateUrl: "lexicon-metadata-edit-dialog.html",
    styleUrl: "lexicon-metadata-edit-dialog.css",
    providers: [LexiconClient],
    imports: [MatGridListModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule]
})
export class LexiconMetadataEditDialogComponent {
    
    public static readonly DEFAULT_HEIGHT: string = "450px";
    public static readonly DEFAULT_WIDTH: string = "700px";

    private lexiconClient = inject(LexiconClient);
    private languageService = inject(LanguageService);

    constructor(
        public dialogRef: MatDialogRef<LexiconMetadataEditDialogComponent, string>,
        @Inject(MAT_DIALOG_DATA) public lexiconId: string,
      ) {}

    formTitle: string;
    warningMsg: string = "";
    isShieldActive: boolean = false;

    lexiconMetadata: LexiconMetadata;
    lexiconImagePath: string;
    languages: Language[];
    
    newImageFile: File;
    newImageTempUrl: URL;

    title: string;
    description: string;
    languageId: number;

    public ngOnInit(): void {
        if (this.lexiconId) {
            this.lexiconClient.loadLexiconMetadata(this.lexiconId)
                .subscribe(lexiconMetadata => { 
                    this.setLexiconMetadata(lexiconMetadata)
                    this.lexiconImagePath = this.lexiconClient.getImagePath(this.lexiconMetadata)
                });
        } else {
            this.lexiconMetadata = LexiconMetadata.getBlankLexiconMetadata();
            this.setLexiconMetadata(this.lexiconMetadata);
            this.lexiconImagePath = this.lexiconClient.getImagePath(this.lexiconMetadata);
        }
        this.languageService.getAllLanguages().subscribe(languages => this.setLanguages(languages));
    }

    onFileSelected(event: Event): void {
        if (event != null && event.target != null) {
            const inputElement = event.target as HTMLInputElement;
            if (inputElement.files != null && inputElement.files.length > 0) {
                this.newImageFile = inputElement.files[0];
                this.lexiconImagePath = URL.createObjectURL(this.newImageFile);
            }
        }
    }

    onSave() {
        if (this.validateEntries()) {
            this.saveLexiconAndClose();
        }
    }
    
    onCancel(): void {
        this.dialogRef.close("");
    }

    onTitleChange(event: Event): void {
        if (event != null && event.target != null) {
            const inputElement = event.target as HTMLInputElement;
            this.title = inputElement.value;
        }
        this.warningMsg = ""
    }

    onDescriptionChange(event: Event): void {
        if (event != null && event.target != null) {
            const inputElement = event.target as HTMLInputElement;
            this.description = inputElement.value;
        }
        this.warningMsg = ""
    }

    private setLexiconMetadata(lexiconMetadata: LexiconMetadata) {
        this.lexiconMetadata = lexiconMetadata;
        this.title = lexiconMetadata.title
        this.description = lexiconMetadata.description;
        this.languageId = lexiconMetadata.languageId;

        if (lexiconMetadata.id) {
            this.formTitle = UPDATE_LEXICON_FORM_TITLE;
        } else {
            this.formTitle = NEW_LEXICON_FORM_TITLE;
        }
    }

    private setLanguages(languages: Language[]): void {
        languages = languages.sort((left, right) => left.id - right.id)
        this.languages = languages;

        if (this.languageId <= 0) {
            this.languageId = languages[0].id;
        }
    }

    private validateEntries(): boolean {
        let isValid: boolean = true;
        this.warningMsg = "";

        if (!this.title || this.title === "") {
            this.warningMsg += "Title is required. ";
            isValid = false;
        }
        if (this.languageId < 1) {
            this.warningMsg += "Language is required. ";
            isValid = false;
        }
        if (this.newImageFile && this.newImageFile.size > MAX_IMAGE_FILE_SIZE) {
            this.warningMsg += "Image file exceeds max size. ";
            isValid = false;
        }
 
        return isValid;
    }

    private saveLexiconAndClose(): void {
        this.isShieldActive = true;

        const imageFileExtenstion: string = this.newImageFile ? this.newImageFile.name.substring(this.newImageFile.name.lastIndexOf(".")) : "";
        const lexiconToSave: LexiconMetadata = new LexiconMetadata(this.lexiconId, this.lexiconMetadata.owner, this.title, this.languageId, this.description, imageFileExtenstion);
        this.lexiconClient.saveLexiconMetadata(lexiconToSave, this.newImageFile).subscribe(lexicon => {
            this.isShieldActive = false;
            this.dialogRef.close(lexicon.id);
        });
    }
}

