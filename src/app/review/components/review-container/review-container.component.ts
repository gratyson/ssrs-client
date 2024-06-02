import { Component, Input, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { CountdownTimerComponent } from "../countdown/countdown-timer.component";
import { ReviewPromptComponent } from "../review-prompt/review-prompt.component";
import { ReviewEvent, ReviewMode, ReviewTestResult, ReviewType, WordReview } from "../../model/review-session";
import { ReviewQueueManager, WordReviewResult } from "../../queue/review-queue-manager";
import { Word } from "../../../lexicon/model/word";
import { AudioPlayerComponent } from "../../../audio/components/audio-player/audio-player.component";
import { ReviewSessionClient } from "../../../client/review-session-client";
import { ReviewSummaryComponent } from "../review-summary/review-summary.component";
import { Router, RouterLink } from "@angular/router";
import { LanguageService } from "../../../language/language-service";
import { Language } from "../../../language/language";
import { SingleWordEditComponent } from "../single-word-edit/single-word-edit.component";

const PAUSE_BUTTON_ICON_RUNNING: string = "pause";
const PAUSE_BUTTON_ICON_PAUSED: string = "play_arrow";
const CORRECT_NEAR_MISS_MULTIPLIER: number = 1.5;

@Component({
    selector: "review-container",
    templateUrl: "review-container.html",
    styleUrl: "review-container.css",
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, CountdownTimerComponent, ReviewPromptComponent, AudioPlayerComponent, MatProgressBarModule, ReviewSummaryComponent, RouterLink, SingleWordEditComponent],
    host: { ["(document:keypress)"]: "onKeypress($event)", ["(document:keydown)"]: "onKeydown($event)" },
})
export class ReviewContainerComponent {

    @ViewChild(CountdownTimerComponent) countdownTimer: CountdownTimerComponent;
    @ViewChild(ReviewPromptComponent) reviewPrompt: ReviewPromptComponent;
    @ViewChild(AudioPlayerComponent) wordAudioPlayer: AudioPlayerComponent;
    @ViewChild(ReviewSummaryComponent) reviewSummaryComponent: ReviewSummaryComponent;
    
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private languageService: LanguageService = inject(LanguageService);

    constructor(private router: Router) { }

    @Input() lexiconId: string;
    @Input() reviewTitle: string = "";
    @Input() reviewWords: WordReview[][];
    @Input() introductionBatchSize: number = 0;
    @Input() testsBetweenIntroduction: number = 0;

    currentWordReview: WordReview;
    language: Language | null = null;
    isPaused: boolean = false;
    advanceOnUnpause: boolean = false;
    pauseButtonIcon: string = PAUSE_BUTTON_ICON_RUNNING;
    percentComplete: number = 0;

    audioWordId: string = "";
    selectedAudioPath: string = "";

    reviewComplete: boolean = false;
    correctWordCount: number = 0;
    totalWordCount: number = 0;
    totalTimeMs: number = 0;
    reviewedWordResults: WordReviewResult[] = [];

    wordToEdit: Word | null = null;
    advanceOnEditComplete: boolean = false;

    private reviewQueueManager: ReviewQueueManager;
    private reviewStartTimeMs: number = 0;
    private currentReviewTimeMs: number = 0;
    private currentResult: ReviewTestResult | null;
    private currentTestTime: number;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        
        if (simpleChanges.hasOwnProperty("reviewWords") && this.reviewWords && this.reviewWords.length > 0) {
            this.reviewQueueManager = new ReviewQueueManager(this.reviewWords, this.introductionBatchSize, this.testsBetweenIntroduction);

            const firstWordReview: WordReview | null = this.reviewQueueManager.getCurrent();
            if (firstWordReview !== null) {
                this.setCurrentWordReview(firstWordReview);
                
            }

            this.reviewComplete = false;
            this.totalTimeMs = 0;
        }
    }

    onReviewTimerComplete(): void {
        this.processCurrentReviewPrompt()
    }

    onReviewResult(result: ReviewTestResult): void {
        this.currentResult = result;
        
        this.currentTestTime = this.currentReviewTimeMs + (new Date().valueOf() - this.reviewStartTimeMs);
        this.countdownTimer.stop();

        const totalTimeMs = this.currentTestTime + this.reviewQueueManager.getTotalTimeSoFar();
        if (this.currentResult.isCorrect && (this.currentWordReview.allowedTimeSec > 0) && (this.currentWordReview.allowedTimeSec * 1000 * CORRECT_NEAR_MISS_MULTIPLIER) < totalTimeMs) {
            this.currentResult.isNearMiss = true;
            this.reviewPrompt.updateResult(this.currentResult);
        }
        
        this.setAudio();  // don't set new audio until immediately before playing, to avoid interrupting the last word's audio
    }

    onAdvanceToNext(): void {
        if (!this.isResultRequired(this.currentWordReview?.reviewMode) || this.currentResult) {
            this.advanceToNext();
        }
    }

    onReviewNextClick(event: Event): void {
        this.processCurrentReviewPrompt();
    }

    onKeypress(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.processCurrentReviewPrompt();
        } 
    }

    onKeydown(event: KeyboardEvent): void {
        if (event.ctrlKey && event.key === "d") {
            event.preventDefault();
            this.deferCurrentTest();
        }

        if (event.ctrlKey && event.key === "p") {
            event.preventDefault();
            this.togglePause();
        }

        // don't allow word edit during test
        if (event.ctrlKey && event.key === "e" && !this.isPaused && this.currentResult && this.currentWordReview.word) {
            event.preventDefault();
            this.wordToEdit = this.currentWordReview.word;
        }
    }

    onPause(): void {
        this.togglePause();
    }


    onSkip(): void {
        if (this.isPaused) {
            this.togglePause();
        }
        this.showReviewSummary()
    }
    
    onClose(): void {
        this.closeReviewContainer();
    }

    onEditWord(wordToEdit: Word): void {
        this.wordToEdit = wordToEdit;
    }

    onEditComplete(newWord: Word): void {
        this.updateReviewedWordResultsWord(newWord);
        this.updateCurrentReviewWordIfNecessary(newWord);
        this.reviewQueueManager.updateWord(newWord);

        this.wordToEdit = null;

        if (this.advanceOnEditComplete) {
            this.advanceOnEditComplete = false;
            this.advanceToNext();
        }
    }

    onReviewedWordResultsChange(reviewedWordResults: WordReviewResult[]): void {
        this.reviewedWordResults = reviewedWordResults;
    }

    private setCurrentWordReview(wordReview: WordReview): void {        
        this.reviewStartTimeMs = new Date().valueOf();
        this.currentReviewTimeMs = 0;
        this.currentWordReview = wordReview;
        this.countdownTimer.start(this.currentWordReview.allowedTimeSec);
        this.updateProgressBar();

        if (!this.language) {
            this.languageService.getLanguage(wordReview.languageId).subscribe((language) => {
                if (language) { 
                    this.language = language
                } else {
                    this.language = null;
                }
            });
        }

        if (this.playAudioOnLoad(wordReview.reviewMode)) {
            this.setAudio();
        }
    }

    private updateProgressBar(): void {
        const progress = this.reviewQueueManager.getProgess()
        this.percentComplete = progress.completedTests / progress.totalTests * 100;
    }

    private setAudio(): void {
        if (this.currentWordReview.word.audioFiles && this.currentWordReview.word.audioFiles.length > 0) {
            const selectedAudioFileIndex = Math.floor(Math.random() * this.currentWordReview.word.audioFiles.length);
            this.selectedAudioPath = this.currentWordReview.word.audioFiles[selectedAudioFileIndex];
            this.audioWordId = this.currentWordReview.word.id;
        } else {
            this.audioWordId = ""
            this.selectedAudioPath = "";
        }
    }

    private showReviewSummary(): void {
        this.countdownTimer.stop();
        this.updateProgressBar();

        this.totalWordCount = 0;
        this.correctWordCount = 0;
        this.reviewedWordResults = [];

        this.reviewQueueManager.getProcessedItems().forEach(wordResult => { 
            this.reviewedWordResults.push(wordResult);
            this.totalWordCount++;
            if (wordResult.reviewTestResult.isCorrect) { 
                this.correctWordCount++;
            }
        });

        this.reviewComplete = true;

        if (this.reviewedWordResults.length === 0) {
            this.closeReviewContainer();
        }
    }

    private processCurrentReviewPrompt(): void {
        if (!this.isPaused) {
            if (this.reviewComplete || !this.currentWordReview) {
                this.closeReviewContainer();
            } else if (this.reviewPrompt) {
                this.reviewPrompt.processNext();
            }
        }
    }

    private deferCurrentTest(): void {
        if (this.currentWordReview && this.reviewPrompt && this.reviewPrompt.canDefer()) {
            const nextWordReview = this.reviewQueueManager.deferAndGetNext(this.currentReviewTimeMs + (new Date().valueOf() - this.reviewStartTimeMs));
            if (nextWordReview !== null) {
                this.setCurrentWordReview(nextWordReview);
            }
        }
    }

    private advanceToNext(): void {
        if (this.currentWordReview.recordResult && this.currentResult) {
            const totalTimeMs = this.currentTestTime + this.reviewQueueManager.getTotalTimeSoFar();
            this.saveTestResult(this.currentWordReview, this.currentResult, totalTimeMs, false);
        }

        if (this.wordToEdit) {
            this.advanceOnEditComplete = true;
        } else if (this.isPaused) {
            this.advanceOnUnpause = true;
        } else {
            let nextWordReview: WordReview | null = null;    
            if (this.currentResult) {
                if (this.currentResult.isCorrect) {
                    nextWordReview = this.reviewQueueManager.markCorrectAndGetNext(this.currentTestTime, this.currentResult.isNearMiss);
                } else {
                    nextWordReview = this.reviewQueueManager.markIncorrectAndGetNext(this.currentTestTime, this.currentResult.isNearMiss, this.buildReminderReview(this.currentWordReview));
                }
            } else {
                nextWordReview = this.reviewQueueManager.markCorrectAndGetNext(this.currentTestTime, false);
            }
            
            this.currentResult = null;
            if (this.currentTestTime) {
                this.totalTimeMs += this.currentTestTime;
            }
            this.currentTestTime = 0;

            if (nextWordReview !== null) {
                this.setCurrentWordReview(nextWordReview);
            } else {
                this.showReviewSummary();
            }
            this.advanceOnUnpause = false;
            this.advanceOnEditComplete = false;
        }
    }

    private updateReviewedWordResultsWord(newWord: Word): void {
        if (this.reviewedWordResults) {
            for (let reviewedWord of this.reviewedWordResults) {
                if (reviewedWord.wordReview.word.id === newWord.id) {
                    reviewedWord.wordReview.word = newWord;
                }
            }
        }
    }

    private updateCurrentReviewWordIfNecessary(newWord: Word): void {
        if (this.currentWordReview?.word?.id === newWord.id) {
            this.currentWordReview.word = newWord;
        }
    }

    private togglePause(): void {
        if (this.isPaused) {
            this.isPaused = false;
            this.pauseButtonIcon = PAUSE_BUTTON_ICON_RUNNING;
            this.reviewStartTimeMs = new Date().valueOf();
            if (this.advanceOnUnpause) {
                this.advanceOnUnpause = false;
                this.advanceToNext();
            } else {
                this.reviewPrompt.focus();
            }
        } else {
            this.isPaused = true;
            this.pauseButtonIcon = PAUSE_BUTTON_ICON_PAUSED;
            this.currentReviewTimeMs += new Date().valueOf() - this.reviewStartTimeMs;
        }
    }

    private closeReviewContainer(): void {
        if (this.reviewedWordResults) {
            for(let result of this.reviewedWordResults) {
                if (result.reviewTestResultOverride) {
                    this.saveTestResult(result.wordReview, result.reviewTestResultOverride, result.totalTime, true);
                }
            }
        }

        this.router.navigate(["/"]);
    }

    private saveTestResult(wordReview: WordReview, result: ReviewTestResult, elapsedTimeMs: number, override: boolean): void {
        this.reviewSessionClient.saveReviewEvent({
            scheduledEventId: wordReview.scheduledEventId,
            lexiconId: this.lexiconId,
            wordId: wordReview.word.id,
            
            reviewMode: wordReview.reviewMode,
            reviewType: wordReview.reviewType,
            testOn: wordReview.testOn,
            promptWith: wordReview.promptWith,
        
            isCorrect: result.isCorrect,
            isNearMiss: result.isNearMiss,
            elapsedTimeMs: elapsedTimeMs,

            override: override
        }).subscribe();
    }

    private buildReminderReview(incorrectWordReview: WordReview): WordReview {
        let reminderReview: WordReview = Object.assign({}, incorrectWordReview);

        reminderReview.reviewMode = incorrectWordReview.reviewMode === ReviewMode.TypingTest ? ReviewMode.WordOverviewWithTyping : ReviewMode.WordOverviewReminder;
        reminderReview.recordResult = false;
        reminderReview.allowedTimeSec = 0;
        
        return reminderReview;
    }

    private isResultRequired(reviewMode: ReviewMode): boolean {
        return reviewMode === ReviewMode.TypingTest || reviewMode === ReviewMode.MultipleChoiceTest;
    }

    private playAudioOnLoad(reviewMode: ReviewMode): boolean {
        return reviewMode === ReviewMode.WordOverview;
    }
}