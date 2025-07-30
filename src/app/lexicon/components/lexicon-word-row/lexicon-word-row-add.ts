import { LexiconWordRowBaseComponent } from "./lexicon-word-row-base";
import { Component, ElementRef, EventEmitter, Input, Output, SimpleChange, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatCheckbox, MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatMenu, MatMenuModule } from '@angular/material/menu'; 
import { Word } from "../../model/word";
import { Language, WordElement } from "../../../language/language";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatDialog } from "@angular/material/dialog";
import { WordClient } from "../../../client/word-client";

@Component({
    selector: "word-row-add", 
    templateUrl: "lexicon-word-row.html",
    styleUrl: "lexicon-word-row.css",
    standalone: true,
    imports: [ MatCheckboxModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule ]
})
export class LexiconWordRowAddComponent extends LexiconWordRowBaseComponent {

    private wordClient: WordClient = inject(WordClient);

    @Output() OnNewWord: EventEmitter<Word> = new EventEmitter<Word>(); 

    public ngOnInit(): void {
        
        this.learnedCheckboxVisibility = "hidden";
        this.audioVisibility = "hidden";
        this.additionalWordOptionsDisplay = "none";
        this.addWordButtonDisplay = "inline";
        this.applyLabels = true;
    }

    override onSaveNewWordClick(event: Event): void {
        if (this.validateRequiredElements()) {
            let newWord: Word = { id: "", elements: this.currentElementValues, attributes: this.currentAttributes, audioFiles: [] };
            this.wordClient.saveWord(newWord, this.lexiconId).subscribe((savedWord) => {
                if(savedWord != null) {
                    this.OnNewWord.emit(savedWord);
                }
                this.currentElementValues = {};
                this.currentAttributes = "";
            });
        }
    }

    private validateRequiredElements(): boolean {
        let errorMsg: string = "";

        for(let languageElement of this.language.requiredElements) { 
            if (!this.currentElementValues[languageElement.id]) {
                errorMsg += `${languageElement.name} is required. `;
            }
        }

        if (!this.currentAttributes) {
            errorMsg += "Attributes are required. ";
        }

        if (errorMsg) {
            this.snackBar.open(errorMsg, "", { duration: 5000 });
        }

        return (!errorMsg);
    }
}