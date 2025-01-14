import { Component, EventEmitter, Input, Output, SimpleChange, SimpleChanges, inject } from "@angular/core";
import { PercentPipe, DatePipe } from "@angular/common";
import { ReviewEvent, ReviewTestResult, ReviewType } from "../../model/review-session";
import { Language } from "../../../language/language";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { WordReviewResult } from "../../queue/review-queue-manager";
import { Word } from "../../../lexicon/model/word";
import { DurationPipe } from "../../../util/duration/duration.pipe";

@Component({
    selector: "review-summary",
    templateUrl: "review-summary.html",
    styleUrl: "review-summary.css",
    standalone: true,
    imports: [ PercentPipe, MatIconModule, MatButtonModule, DurationPipe ],
})
export class ReviewSummaryComponent {

    private readonly OVERRIDE_SET_BORDER_COLOR: string = "black";
    readonly LEARNING_REVIEW_TYPE: ReviewType = ReviewType.Learn;

    readonly ALLOWED_OVERIDE_OPTIONS: OverrideOption[] = [
        { result: { isCorrect: true, isNearMiss: false }, icon: "check", class: "correct-answer-color" },
        { result: { isCorrect: true, isNearMiss: true }, icon: "check", class: "correct-answer-near-miss-color" },
        { result: { isCorrect: false, isNearMiss: false }, icon: "close", class: "incorrect-answer-color" },
        { result: { isCorrect: false, isNearMiss: true }, icon: "close", class: "incorrect-answer-near-miss-color" },
    ]

    @Input() correctWordCount: number = 0;
    @Input() totalWordCount: number = 0;
    @Input() totalTimeMs: number = 0;
    @Input() lexiconId: string = "";
    @Input() language: Language | null = null;
    @Input() reviewedWordResults: WordReviewResult[] = [];

    @Output() reviewedWordResultsChange: EventEmitter<WordReviewResult[]> = new EventEmitter<WordReviewResult[]>();
    @Output() editWord: EventEmitter<Word> = new EventEmitter<Word>();

    reviewedWordOverrideOptions: number[] = [];
    reviewedWordOverrideBorder: string[] = [];

    public ngOnInit(): void {
        if (this.reviewedWordResults) {
            for(let reviewedWordResult of this.reviewedWordResults) {
                let result: ReviewTestResult;
                if (reviewedWordResult.reviewTestResultOverride === null) {
                    result = reviewedWordResult.reviewTestResult;
                    this.reviewedWordOverrideBorder.push("");
                } else {
                    result = reviewedWordResult.reviewTestResultOverride;
                    this.reviewedWordOverrideBorder.push(this.OVERRIDE_SET_BORDER_COLOR);
                }

                if (result.isCorrect) {
                    if (result.isNearMiss) {
                        this.reviewedWordOverrideOptions.push(1);
                    } else {
                        this.reviewedWordOverrideOptions.push(0);
                    }
                } else {
                    if (result.isNearMiss) {
                        this.reviewedWordOverrideOptions.push(3);
                    } else {
                        this.reviewedWordOverrideOptions.push(2);
                    }
                }
                
            }
        }
    }

    public updateWord(word: Word): void {
        for(let reviewedWordResult of this.reviewedWordResults) {
            if (reviewedWordResult.wordReview.word.id === word.id) {
                reviewedWordResult.wordReview.word = word;
                break;
            }
        }
    }

    onOverrideClick(index: number): void {
        this.reviewedWordOverrideOptions[index] = (this.reviewedWordOverrideOptions[index] + 1) % this.ALLOWED_OVERIDE_OPTIONS.length;

        if (this.isReviewOverridden(index)) {
            this.reviewedWordOverrideBorder[index] = this.OVERRIDE_SET_BORDER_COLOR;
            this.reviewedWordResults[index].reviewTestResultOverride = this.getOverrideEvent(index);
        } else {
            this.reviewedWordOverrideBorder[index] = "";
            this.reviewedWordResults[index].reviewTestResultOverride = null;
        }

        this.reviewedWordResultsChange.emit(this.reviewedWordResults);
    }

    onEditClick(index: number): void {
        this.editWord.emit(this.reviewedWordResults[index].wordReview.word);
    }

    private isReviewOverridden(index: number): boolean {
        return (this.reviewedWordResults[index].reviewTestResult.isCorrect !== this.ALLOWED_OVERIDE_OPTIONS[this.reviewedWordOverrideOptions[index]].result.isCorrect)
            || (this.reviewedWordResults[index].reviewTestResult.isNearMiss !== this.ALLOWED_OVERIDE_OPTIONS[this.reviewedWordOverrideOptions[index]].result.isNearMiss)
    }

    private getOverrideEvent(index: number): ReviewEvent {
        return {
            scheduledEventId: this.reviewedWordResults[index].wordReview.scheduledEventId,
            lexiconId: this.lexiconId,
            wordId: this.reviewedWordResults[index].wordReview.word.id,
            
            reviewMode: this.reviewedWordResults[index].wordReview.reviewMode,
            reviewType: this.reviewedWordResults[index].wordReview.reviewType,
            testOn: this.reviewedWordResults[index].wordReview.testOn,
            promptWith: this.reviewedWordResults[index].wordReview.promptWith,
        
            isCorrect: this.ALLOWED_OVERIDE_OPTIONS[this.reviewedWordOverrideOptions[index]].result.isCorrect,
            isNearMiss: this.ALLOWED_OVERIDE_OPTIONS[this.reviewedWordOverrideOptions[index]].result.isNearMiss,
            elapsedTimeMs: this.reviewedWordResults[index].totalTime,
        
            override: true,
        }
    }
}

interface OverrideOption {
    result: ReviewTestResult;
    icon: string;
    class: string;
}