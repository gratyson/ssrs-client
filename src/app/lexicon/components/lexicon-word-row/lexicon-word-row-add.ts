import { LexiconWordRowBaseComponent } from "./lexicon-word-row-base";
import { Component, ElementRef, EventEmitter, Input, Output, SimpleChange, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
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
    imports: [ MatCheckboxModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule ]
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
        if (this.validateWord(true)) {
            let newWord: Word = { id: "", elements: this.getElementValues(), attributes: this.attributeFormControl.value, audioFiles: [] };
            this.wordClient.saveWord(newWord, this.lexiconId).subscribe((savedWord) => {
                if(savedWord != null) {
                    this.OnNewWord.emit(savedWord);
                }

                this.clearElementValues();
                this.attributeFormControl.setValue("");
            });
        }
    }
}