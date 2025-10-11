import { Component, ElementRef, EventEmitter, Input, Output, SimpleChange, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormControl, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from "@angular/forms";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from '@angular/material/menu'; 
import { Word } from "../../model/word";
import { Language, WordElement } from "../../../language/language";
import { WordClient } from "../../../client/word-client";
import { DialogPosition, MatDialog } from "@angular/material/dialog";
import { AudioEditDialogComponent, AudioEditDialogData } from "../../../audio/components/audio-edit-dialog/audio-edit-dialog.component";
import { LexiconWordRowBaseComponent } from "./lexicon-word-row-base";
import { AudioClient } from "../../../client/audio-client";
import { EMPTY_LEXICON_REVIEW_HISTORY, LexiconReviewHistory } from "../../model/lexicon";
import { ReviewEvent, ReviewSession, ReviewTestResult, ReviewType } from "../../../review/model/review-session";
import { ReviewSessionClient } from "../../../client/review-session-client";
import { Duration } from "../../../util/duration/duration";
import { UserConfigService } from "../../../user-config/user-config.service";
import { InitialTestDelay } from "../../../user-config/user-config-setting";
import { ConfirmDialog } from "../../../util/confirm-dialog";
import { WordReviewResult } from "../../../review/queue/review-queue-manager";
import { ReviewMode } from "../../../review/model/review-mode";

const HAS_AUDIO_COLOR: string = "black";
const NO_AUDIO_COLOR: string = "#d9d9d9";

@Component({
    selector: "word-row-edit",
    templateUrl: "lexicon-word-row.html",
    styleUrl: "lexicon-word-row.css",
    imports: [MatCheckboxModule, FormsModule, MatFormFieldModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatIconModule, MatMenuModule]
})
export class LexiconWordRowEditComponent extends LexiconWordRowBaseComponent {

    private wordClient: WordClient = inject(WordClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private userConfigService: UserConfigService = inject(UserConfigService);

    @Input() word: Word;

    @Output() deleteWord: EventEmitter<Word> = new EventEmitter<Word>();
    @Output() wordChange: EventEmitter<Word> = new EventEmitter<Word>();
    @Output() reviewHistoryChange: EventEmitter<LexiconReviewHistory> = new EventEmitter<LexiconReviewHistory>();
    @Output() viewHistory: EventEmitter<LexiconReviewHistory> = new EventEmitter<LexiconReviewHistory>();

    public ngOnInit(): void { 
        this.learnedCheckboxDisabled = true;
    }

    public override ngOnChanges(changes: SimpleChanges): void {
        if (changes.hasOwnProperty("word") || changes.hasOwnProperty("language")) {
            this.updateWordFields();
            this.updateAudioButton();
        }
        if (changes.hasOwnProperty("reviewHistory")) {
            this.updateLearned();
        }
    }

    private updateWordFields(): void {
        if (this.word && this.language) {
            this.clearElementValues();

            let requiredElementIds: Set<string> = new Set<string>();
            for (let languageElement of this.language.requiredElements) {
                requiredElementIds.add(languageElement.id);
            }

            for(let languageElement of this.language.validElements) {
                let elementValue = this.word.elements[languageElement.id];
                if (!elementValue) {
                    elementValue = "";
                }

                let validators = [];
                if (requiredElementIds.has(languageElement.id)) {
                    validators.push(Validators.required);
                }
                if (languageElement.validationRegex) {
                    validators.push(Validators.pattern(new RegExp(languageElement.validationRegex)));
                }

                this.elementFormControls[languageElement.id] = new FormControl(elementValue, validators);
            }

            this.attributeFormControl = new FormControl(this.word.attributes, [Validators.required]);
        }
    }

    private updateAudio(audioFiles: string[]): void {
        this.word.audioFiles = [...audioFiles];
        this.updateAudioButton();
    }

    private updateAudioButton(): void {
        if (this.word.audioFiles && this.word.audioFiles.length > 0) {
            this.audioButtonColor = HAS_AUDIO_COLOR;
        } else {
            this.audioButtonColor = NO_AUDIO_COLOR;
        }
    }

    private updateLearned(): void {
        if (this.reviewHistory) {
            this.learnedCheckboxChecked = this.reviewHistory.learned;
        } else {
            this.learnedCheckboxChecked = false;
        }
    }

    override onElementUpdate(event: Event, elementId: string): void {
        this.saveWord();
    }

    override onAttributeUpdate(event: Event): void {
        this.saveWord();
    }

    override onAudioClick(event: Event): void {        
        const dialogRef = this.dialog.open(AudioEditDialogComponent, {
            data: new AudioEditDialogData(this.word, this.editAudioButton._elementRef),
            //width: `${AudioEditDialogComponent.DEFAULT_WIDTH}`,            
        });
        dialogRef.componentInstance.onAudioChanged.subscribe(newAudioFiles => this.updateAudio(newAudioFiles));
    }

    override onDeleteWordClick(event: Event): void {
        const dialogRef = this.dialog.open(ConfirmDialog, {
            data: { 
                title: "Delete Word?", 
                message: `Delete all data and learning history for this word?`,
                confirmAction: "Delete",
                cancelAction: "Cancel",
            }
        });

        dialogRef.afterClosed().subscribe(result => { 
            if (result) {
                this.deleteWord.emit(this.word);
            }
        });
    }

    override onViewHistoryClick(event: Event): void {
        if (this.reviewHistory) {
            this.viewHistory.emit(this.reviewHistory);
        }
    }

    override onToggleWordLearned(event: Event): void {
        if (this.reviewHistory && this.reviewHistory.learned) {
            this.deleteReviewHistory();
        } else {
            this.createReviewHistory();
        }
    }

    override recordEvent(event: Event, eventResult: ReviewTestResult): void {
        const dialogRef = this.dialog.open(ConfirmDialog, {
            data: {
                title: "Record Event?",
                message: `This action will affect learning history and future review times. Record this event?`,
                confirmAction: "Record",
                cancelAction: "Cancel",
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.reviewSessionClient.processManualEvent(this.generateReviewEvent(eventResult)).subscribe(() => {
                    this.reviewSessionClient.getLexiconReviewHistoryBatch(this.lexiconId, [this.word.id]).subscribe(wordHistories => {
                        if (wordHistories && wordHistories.length > 0) {
                            this.reviewHistory = wordHistories[0];
                            this.reviewHistoryChange.emit(wordHistories[0]);
                        }
                    })
                });
            }
        });
    }

    private saveWord(): void {
        if (this.validateWord(false)) {
            let updatedWord: Word = { id: this.word.id, elements: this.getElementValues(), attributes: this.attributeFormControl.value, audioFiles: this.word.audioFiles };
            this.wordClient.updateWord(updatedWord).subscribe((savedWord) => {
                if (savedWord != null) {
                    this.word = savedWord;
                }
            });
            this.wordChange.emit(updatedWord);
        }
    }

    private generateReviewEvent(result: ReviewTestResult): ReviewEvent {
        return {
            scheduledEventId: null,
            lexiconId: this.lexiconId,
            wordId: this.word.id,

            reviewMode: ReviewMode.TypingTest,
            reviewType: ReviewType.Review,
            testOn: this.language.testRelationships[0].testOn,
            promptWith: this.language.testRelationships[0].promptWith,

            isCorrect: result.isCorrect,
            isNearMiss: result.isNearMiss,
            elapsedTimeMs: 0,

            override: false,
        }
    }

    private deleteReviewHistory(): void {
        const dialogRef = this.dialog.open(ConfirmDialog, {
            data: { 
                title: "Delete Learning History?", 
                message: `Delete all learning history for this word?`,
                confirmAction: "Delete",
                cancelAction: "Cancel",
            }
        });

        dialogRef.afterClosed().subscribe(result => { 
            if (result) {
                this.reviewSessionClient.deleteLexiconReviewHistory(this.lexiconId, this.word.id).subscribe(() => {
                    this.reviewHistory = EMPTY_LEXICON_REVIEW_HISTORY;
                    this.updateLearned();
                    this.reviewHistoryChange.emit(EMPTY_LEXICON_REVIEW_HISTORY);
                });
            }
        });
    }

    private createReviewHistory(): void {
        this.userConfigService.getCurrentConfigValue(InitialTestDelay).subscribe(initialTestDelay => { 
            const reviewHistory = {
                lexiconId: this.lexiconId,
                wordId: this.word.id,
                learned: true,
                mostRecentTestTime: new Date(),
                nextTestRelationId: this.language.testRelationships[0].id,
                currentTestDelay: initialTestDelay,
                nextTestTime: new Date(new Date().valueOf() + initialTestDelay.toMillis()), 
                currentBoost: 0,
                currentBoostExpirationDelay: Duration.fromMillis(0),
                testHistory: {}
            };

            this.reviewSessionClient.saveLexiconReviewHistoryBatch(this.lexiconId, [reviewHistory]).subscribe(() => {
                this.reviewHistory = reviewHistory;
                this.updateLearned();
                this.reviewHistoryChange.emit(reviewHistory);
            });
        });
    }


}