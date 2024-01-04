import { Component, Input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { LexiconWordRowBaseComponent } from "./lexicon-word-row-base";
import { WordElement } from "../../../language/language";

@Component({
    selector: "word-row-header",
    templateUrl: "lexicon-word-row.html",
    styleUrl: "lexicon-word-row.css",
    standalone: true,
    imports: [ MatCheckboxModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule ]
})
export class LexiconWordRowHeaderComponent extends LexiconWordRowBaseComponent {

    public ngOnInit(): void { 
        this.learnedCheckboxVisibility = "hidden";
        this.audioVisibility = "hidden";
        this.additionalWordOptionsVisibility = "hidden";
        this.isInput = false;
        
        this.initFields();
    }

    override getFontName(languageElement: WordElement): string {
        return "";
    }

    private initFields(): void {
        if (this.language) {
            this.currentElementValues = {};
            for(let languageElement of this.language.validElements) {
                this.currentElementValues[languageElement.id] = languageElement.name;
            }
            this.currentAttributes = "Attributes";
        }
    }
}