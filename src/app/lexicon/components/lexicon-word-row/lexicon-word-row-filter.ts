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
import { WordClient, WordFilterOptions } from "../../../client/word-client";
import { Observable, Subject, debounce, debounceTime } from "rxjs";

const DEBOUNCE_TIME_MS: number = 1000;
const AUDIO_FILTER_OFF_ICON = "filter_alt_off";
const HAS_AUDIO_FILTER_ICON = "filter";
const NO_AUDTIO_FILTER_ICON = "filter_none";

@Component({
    selector: "word-row-filter",
    templateUrl: "lexicon-word-row.html",
    styleUrl: "lexicon-word-row.css",
    imports: [MatCheckboxModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule]
})
export class LexiconWordRowFilterComponent extends LexiconWordRowBaseComponent {

    filterResult: Observable<void>;
    subject: Subject<void> = new Subject<void>();

    currentAudioFilter: boolean | null;
    currentLearnedFilter: boolean | null;

    @Output() OnFilterWordUpdate: EventEmitter<WordFilterOptions> = new EventEmitter<WordFilterOptions>();

    public ngOnInit(): void {
        this.additionalWordOptionsVisibility = "hidden";
        this.applyLabels = true;
        this.labelPrefix = "Filter "

        this.learnedCheckboxChecked = false;
        this.learnedCheckboxIndeterminate = true;
        this.currentLearnedFilter = null;

        this.currentAudioFilter = null;
        this.audioIcon = AUDIO_FILTER_OFF_ICON;

        this.filterResult = this.subject.pipe(debounceTime(DEBOUNCE_TIME_MS));
        this.filterResult.subscribe(value => this.onFilterUpdate());
    }

    override onElementKeyup(event: Event, elementId: string): void {
        this.subject.next();
    }

    override onAttributeKeyup(event: Event): void {
        this.subject.next();
    }

    override onAudioClick(event: Event) {    
        if (this.currentAudioFilter === null) {
            this.currentAudioFilter = true;
            this.audioIcon = HAS_AUDIO_FILTER_ICON;
        } else if (this.currentAudioFilter === true) {
            this.currentAudioFilter = false;
            this.audioIcon = NO_AUDTIO_FILTER_ICON;
        } else {
            this.currentAudioFilter = null;
            this.audioIcon = AUDIO_FILTER_OFF_ICON;
        }

        this.subject.next();
    }

    override onLearnedCheckboxClick(event: Event): void {
        if (this.currentLearnedFilter === null) {
            this.learnedCheckboxChecked = false;
            this.learnedCheckboxIndeterminate = false;
            this.currentLearnedFilter = false;
        } else if (this.currentLearnedFilter === false) {
            this.learnedCheckboxChecked = true;
            this.learnedCheckboxIndeterminate = false;
            this.currentLearnedFilter = true;
        } else {
            this.learnedCheckboxChecked = false;
            this.learnedCheckboxIndeterminate = true;
            this.currentLearnedFilter = null;
        }

        this.subject.next();
    }

    private onFilterUpdate(): void {
        const filter: WordFilterOptions = { elements: this.getElementValues(), attributes: this.attributeFormControl.value, learned: this.currentLearnedFilter, hasAudio: this.currentAudioFilter };
        this.OnFilterWordUpdate.emit(filter);
    }
}