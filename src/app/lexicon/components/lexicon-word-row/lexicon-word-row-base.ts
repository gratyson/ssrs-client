import { Component, Input, SimpleChanges, ViewChild } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
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
    imports: [ MatCheckboxModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule, ReactiveFormsModule ]
})
export class LexiconWordRowBaseComponent {

    @Input() language: Language;
    @Input() lexiconId: string;
    @Input() reviewHistory: LexiconReviewHistory;
    @Input() onlyAllowWordEdit: boolean = false;

    @ViewChild("learnedCheckbox") learnedCheckbox: MatCheckbox;
    @ViewChild("editAudioButton") editAudioButton: MatButton;
    @ViewChild("additionalWordOptions") additionalWordOptions: MatMenu;

    learnedCheckboxVisibility: string  = "inherit";
    audioVisibility: string  = "inherit";
    
    additionalWordOptionsVisibility: string  = "inherit";
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
    

    elementFormControls: {[k:string]: FormControl} = {};
    attributeFormControl: FormControl = new FormControl("", []);

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty("language")) {
            this.initializeFormControls();
        }
    }

    getFontName(languageElement: WordElement): string {
        if (languageElement.applyLanguageFont) { 
            return this.language.fontName;
        }

        return "";
    }

    onElementUpdate(event: Event, elementId: string): void {

    }

    onElementKeyup(event: Event, elementId: string): void {

    }

    onAttributeUpdate(event: Event) {

    }

    onAttributeKeyup(event: Event) {

    }

    onLearnedCheckboxClick(event: Event): void {

    }

    onAudioClick(event: Event): void {        

    }

    onSaveNewWordClick(event: Event): void {

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

    validateWord(showErrorInSnackbar: boolean): boolean {
        let errorMsg: string = "";

        for (let languageElement of this.language.validElements) {
            const elementValue = this.elementFormControls[languageElement.id].value;
            if (elementValue && languageElement.validationRegex && !(new RegExp(languageElement.validationRegex)).test(elementValue)) {
                errorMsg += `${languageElement.name} is invalid. `;
            }
        }
        
        for (let requiredElement of this.language.requiredElements) {
            if (!this.elementFormControls[requiredElement.id].value) {
                errorMsg += `${requiredElement.name} is required. `;
            }
        }

        if (!this.attributeFormControl.value) {
            errorMsg += "Attributes are required. ";
        }

        if (errorMsg && showErrorInSnackbar) {
            this.snackBar.open(errorMsg, "", { duration: 5000 });
        }

        return (!errorMsg);
    }

    getElementValues(): {[k:string]: string} {
        let elementValues: {[k:string]: string} = {};

        for (let languageElement of this.language.validElements) {
            elementValues[languageElement.id] = this.elementFormControls[languageElement.id].value;
        }

        return elementValues;
    }

    clearElementValues(): void {
        for (let languageElement of this.language.validElements) {
            if (this.elementFormControls[languageElement.id]) {
            this.elementFormControls[languageElement.id].setValue("");
            }
        }
    }

    private initializeFormControls(): void {
        if (this.language) {
            this.elementFormControls = {};

            for (let languageElement of this.language.validElements) {
                this.elementFormControls[languageElement.id] = new FormControl("", []);
            }
        }
    }
}