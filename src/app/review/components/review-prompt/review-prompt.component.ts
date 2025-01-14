import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import {  MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatChipsModule } from "@angular/material/chips"; 
import { CountdownTimerComponent } from "../countdown/countdown-timer.component";
import { ReviewTestResult, ReviewType, WordReview } from "../../model/review-session";
import { LanguageService } from "../../../language/language-service";
import { environment } from "../../../../environments/environment";
import { Language, WordElement } from "../../../language/language";
import { timer } from "rxjs";
import { TypingTestPromptComponent } from "../typing-test-prompt/typing-test-prompt.component";
import { WordOverviewComponent } from "../word-overview/word-overview.component";
import { ReviewAttributesComponent } from "../review-attributes/review-attributes.component";
import { MultipleChoicePromptComponent } from "../multiple-choice-prompt/multiple-choice-prompt.component";
import { Word } from "../../../lexicon/model/word";
import { ReviewMode } from "../../model/review-mode";

const ADVANCE_TO_NEXT_TEST_WAIT_TIME_MS = 3000;
const NON_TEST_TIME_BEFORE_PROCESS_MS = 500;

@Component({
    selector: "review-prompt",
    templateUrl: "review-prompt.html",
    styleUrl: "review-prompt.css",
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatChipsModule, TypingTestPromptComponent, WordOverviewComponent, ReviewAttributesComponent, MultipleChoicePromptComponent],
})
export class ReviewPromptComponent {

    private languageService: LanguageService = inject(LanguageService);
    
    @ViewChild(TypingTestPromptComponent) typingTestPrompt: TypingTestPromptComponent;
    @ViewChild(MultipleChoicePromptComponent) multipleChoiceTestPrompt: MultipleChoicePromptComponent;
    @ViewChild(CountdownTimerComponent) countdownTimer: CountdownTimerComponent;

    @Input() wordReview: WordReview;
    @Input() disabled: boolean = false;
    @Input() previouslyDelayedTestTimeMs: number = 0;
    @Input() touchscreenMode: boolean = false;

    @Output() reviewResult: EventEmitter<ReviewTestResult> = new EventEmitter<ReviewTestResult>();
    @Output() advanceToNext: EventEmitter<void> = new EventEmitter<void>();
    @Output() editWord: EventEmitter<Word> = new EventEmitter<Word>();

    promptWithFont: string = environment.DEFAULT_FONT_NAME;
    testOnFont: string = environment.DEFAULT_FONT_NAME;
    showAfterTestFont: string = environment.DEFAULT_FONT_NAME;
    showAfterTestVisibiliy: string = "hidden";
    testStartTime: number = 0;

    currentLanguage: Language;

    private result: ReviewTestResult | null = null;
    private advanceCounter: number = 0;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("wordReview") && this.wordReview) {
            if (!this.currentLanguage || this.currentLanguage.id !== this.wordReview.languageId) {
                this.languageService.getLanguage(this.wordReview.languageId).subscribe((language) => {
                    if (language) {
                        this.currentLanguage = language;
                        this.setLanguageProperties();
                    }
                });
            } else {
                this.setLanguageProperties();
            }

            this.resetInputFields();
        }
    }

    public processNext(): void {
        this.onProcessNext();
    }

    public canDefer(): boolean {
        return this.wordReview.reviewType !== ReviewType.Learn 
               && this.wordReview.reviewMode !== ReviewMode.WordOverview
               && this.wordReview.reviewMode !== ReviewMode.WordOverviewReminder
               && this.wordReview.reviewMode !== ReviewMode.WordOverviewWithTyping;
    }

    public resetFields(): void {
        this.resetInputFields();

        if(this.typingTestPrompt) {
            this.typingTestPrompt.resetFields();
        }
    }

    public updateResult(result: ReviewTestResult): void {
        if(this.typingTestPrompt) {
            this.typingTestPrompt.updateResult(result);
        }
    }

    public focus(): void {
        if (this.typingTestPrompt) {
            this.typingTestPrompt.focus();
        }
    }

    onTypingTestResult(result: ReviewTestResult): void {
        this.processResult(result);
    }

    onMultipleChoiceTestResult(result: ReviewTestResult): void {
        this.processResult(result);
    }

    onEditWord(word: Word): void {
        this.editWord.emit(word);
    }

    showOverview(): boolean {
        return this.wordReview?.reviewMode.isOverview();
    }

    showTypingPrompt(): boolean {
        return this.wordReview?.reviewMode.isTypingTest();
    }
    
    showMultipleChoice(): boolean {
        return this.wordReview?.reviewMode.isMultpleChoiceTest();
    }

    private resetInputFields(): void {
        this.testStartTime = this.getCurrentMillis();
        this.result = null;
        this.showAfterTestVisibiliy = "hidden";
        if (this.showTypingPrompt()) {
            setTimeout(() => {
                if (this.typingTestPrompt) {
                    this.typingTestPrompt.focus();
                }
            });
        }
    }

    private setLanguageProperties(): void {
        const languageFont: string = this.currentLanguage.fontName;

        this.languageService.getWordElementMap().subscribe((wordElementMap) => {
            this.promptWithFont = this.getFont(this.currentLanguage, wordElementMap, this.wordReview.promptWith);
            this.testOnFont = this.getFont(this.currentLanguage, wordElementMap, this.wordReview.testOn);
            this.showAfterTestFont = this.getFont(this.currentLanguage, wordElementMap, this.wordReview.showAfterTest);
        });
    }

    private getFont(language: Language, wordElementMap: { [k:string]: WordElement}, elementName: string): string {
        if (elementName) {
            const languageElement: WordElement | undefined = wordElementMap[elementName];
            if (languageElement && languageElement.applyLanguageFont) {
                return language.fontName;
            }
        }

        return environment.DEFAULT_FONT_NAME;
    }

    private processResult(result: ReviewTestResult): void {
        this.result = result;
        this.emitReviewResult();

        this.showAfterTestVisibiliy = "visible";
        this.startAdvanceTimer();
    }

    private forceProcessTest(): void {
        if (this.result === null) {
            if (this.wordReview.reviewMode === ReviewMode.TypingTest) {
                this.typingTestPrompt?.processTest();
            } else if (this.wordReview.reviewMode === ReviewMode.MultipleChoiceTest) {
                this.multipleChoiceTestPrompt?.processTest();
            } else {
                // No answer to check
                this.processNonTest();
            }
        }   
    }

    private processNonTest(): void {
        // Add a small small delay before advancing to avoid accidently skipping a non-test if the enter key is held down too long
        if ((this.getCurrentMillis() - this.testStartTime) >= NON_TEST_TIME_BEFORE_PROCESS_MS) {
            this.advanceToNextTest();
        }
    }

    private emitReviewResult(): void {
        if (this.result !== null) {
            this.reviewResult.emit(this.result);
        }
    }

    private onProcessNext(): void {
        if (this.result === null) {
            this.forceProcessTest();
        } else {
            this.advanceToNextTest();
        }
    }

    private startAdvanceTimer(): void {
        const curAdvanceCounter: number = this.advanceCounter;
        timer(ADVANCE_TO_NEXT_TEST_WAIT_TIME_MS).subscribe(() => {
            if (this.result !== null && curAdvanceCounter === this.advanceCounter) {
                this.advanceToNextTest();
            } 
        });
    }

    private advanceToNextTest(): void {
        this.advanceCounter++;
        this.advanceToNext.emit();
    }

    private getCurrentMillis(): number {
        return new Date().valueOf();
    }
}

