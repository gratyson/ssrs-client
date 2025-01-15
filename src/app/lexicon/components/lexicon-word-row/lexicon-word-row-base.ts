import { Component, ElementRef, Input, SimpleChange, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatCheckbox, MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatMenu, MatMenuModule } from '@angular/material/menu'; 
import { Language, WordElement } from "../../../language/language";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LexiconReviewHistory } from "../../model/lexicon";
import { MatDialog } from "@angular/material/dialog";
import { ReviewTestResult } from "../../../review/model/review-session";

const HAS_AUDIO_COLOR: string = "black";
const NO_AUDIO_COLOR: string = "#d9d9d9";

@Component({
    selector: "word-row-base", 
    templateUrl: "lexicon-word-row.html",
    styleUrl: "lexicon-word-row.css",
    standalone: true,
    imports: [ MatCheckboxModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule ]
})
export class LexiconWordRowBaseComponent {

    @Input() language: Language;
    @Input() lexiconId: string;
    @Input() reviewHistory: LexiconReviewHistory;
    @Input() onlyAllowWordEdit: boolean = false;

    @ViewChild("learnedCheckbox") learnedCheckbox: MatCheckbox;
    @ViewChild("editAudioButton") editAudioButton: MatButton;
    @ViewChild("additionalWordOptions") additionalWordOptions: MatMenu;

    learnedCheckboxVisibility: string  = "inherited";
    audioVisibility: string  = "inherited";
    
    additionalWordOptionsVisibility: string  = "inherited";
    additionalWordOptionsDisplay: string  = "inline";
    
    addWordButtonDisplay: string  = "none";
    
    audioButtonColor: string = HAS_AUDIO_COLOR;
    applyLabels: boolean = false;
    labelPrefix: string = "";

    learnedCheckboxDisabled: boolean = false;
    learnedCheckboxIndeterminate: boolean = false;
    learnedCheckboxChecked: boolean = false;
    isInput: boolean = true;

    audioIcon = "arrow_drop_down";

    constructor(public dialog: MatDialog, 
                public snackBar: MatSnackBar) {}
    

    currentElementValues: {[k:string]: string} = {};
    currentAttributes: string = "";

    getFontName(languageElement: WordElement): string {
        if (languageElement.applyLanguageFont) { 
            return this.language.fontName;
        }

        return "";
    }

    onFieldUpdate(event: Event): void {

    }

    onLearnedCheckboxClick(event: Event): void {

    }

    onAudioClick(event: Event): void {        

    }

    onSaveNewWordClick(event: Event): void {

    }

    onFieldKeyup(event: Event): void {

    }

    onDeleteWordClick(event: Event): void {

    }

    onViewHistoryClick(event: Event): void {

    }
    
    onToggleWordLearned(event: Event): void {

    }

    onRecordEventIncorrect(event: Event): void {
        this.recordEvent(event, { isCorrect: false, isNearMiss: false});
    }

    onRecordEventIncorrectNearMiss(event: Event): void {
        this.recordEvent(event, { isCorrect: false, isNearMiss: true});
    }

    onRecordEventIncorrectCorrectTimeElapsed(event: Event): void {
        this.recordEvent(event, { isCorrect: true, isNearMiss: true});
    }

    recordEvent(event: Event, result: ReviewTestResult): void {

    }
}