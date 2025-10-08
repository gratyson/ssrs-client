import { Component, Input, SimpleChanges, ViewChild, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { CountdownTimerComponent } from "../countdown/countdown-timer.component";
import { ReviewPromptComponent } from "../review-prompt/review-prompt.component";
import { ReviewTestResult, WordReview } from "../../model/review-session";
import { ReviewQueueManager, WordReviewResult } from "../../queue/review-queue-manager";
import { Word } from "../../../lexicon/model/word";
import { AudioPlayerComponent } from "../../../audio/components/audio-player/audio-player.component";
import { ReviewSessionClient } from "../../../client/review-session-client";
import { ReviewSummaryComponent } from "../review-summary/review-summary.component";
import { Router, RouterLink } from "@angular/router";
import { LanguageService } from "../../../language/language-service";
import { Language } from "../../../language/language";
import { SingleWordEditComponent } from "../single-word-edit/single-word-edit.component";
import { ReviewMode } from "../../model/review-mode";
import { UserConfigService } from "../../../user-config/user-config.service";
import { TouchscreenModeSetting } from "../../../user-config/user-config-setting";
import { WordOverviewComponent } from "../word-overview/word-overview.component";

const PAUSE_BUTTON_ICON_RUNNING: string = "pause";
const PAUSE_BUTTON_ICON_PAUSED: string = "play_arrow";
const CORRECT_NEAR_MISS_MULTIPLIER: number = 1.5;

@Component({
    selector: "review-container",
    templateUrl: "review-container.html",
    styleUrl: "review-container.css",
    standalone: true,
    imports: [FormsModule, ReactiveFormsModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, CountdownTimerComponent, ReviewPromptComponent, AudioPlayerComponent, MatProgressBarModule, ReviewSummaryComponent, SingleWordEditComponent, WordOverviewComponent],
    host: { ["(document:keypress)"]: "onKeypress($event)", ["(document:keydown)"]: "onKeydown($event)" },
})
export class ReviewContainerComponent {

    @ViewChild(CountdownTimerComponent) countdownTimer: CountdownTimerComponent;
    @ViewChild(ReviewPromptComponent) reviewPrompt: ReviewPromptComponent;
    @ViewChild(AudioPlayerComponent) wordAudioPlayer: AudioPlayerComponent;
    @ViewChild(ReviewSummaryComponent) reviewSummaryComponent: ReviewSummaryComponent;
    
    @ViewChild("pauseButton") pauseButton: MatButton;
    @ViewChild("nextButton") nextButton: MatButton;

    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private languageService: LanguageService = inject(LanguageService);
    private userConfigService: UserConfigService = inject(UserConfigService);

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
    preloadAudio: boolean = false;

    showSummary: boolean = false;
    showOveviewWordFromSummary: Word | null = null;
    reviewComplete: boolean = false;
    correctWordCount: number = 0;
    totalWordCount: number = 0;
    totalTimeMs: number = 0;
    reviewedWordResults: WordReviewResult[] = [];

    startTimeMs: number;
    pauseTimeStartMs: number;
    totalPauseTimeMs: number = 0;

    wordToEdit: Word | null = null;
    advanceOnEditComplete: boolean = false;
    touchscreenMode: boolean = false;
    timeModifier: number = 1;

    private reviewQueueManager: ReviewQueueManager;
    private reviewStartTimeMs: number = 0;
    private currentReviewTimeMs: number = 0;
    private currentResult: ReviewTestResult | null;
    private currentTestTime: number;

    public ngOnInit() {
        this.userConfigService.getCurrentConfigValue(TouchscreenModeSetting).subscribe(touchscreenModeSetting => {
            // "pointer: coarse" should detect if the primary input is a touchscreen. If detecting if touchscreen input exists at all would be "any-pointer: coarse"
            this.touchscreenMode = (touchscreenModeSetting === 1) || (touchscreenModeSetting === 0 && window.matchMedia("(pointer: coarse)").matches);
        });

        if (this.touchscreenMode) {
            this.timeModifier = 1.5;
        }
    }

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        
        if (simpleChanges.hasOwnProperty("reviewWords") && this.reviewWords && this.reviewWords.length > 0) {
            this.reviewQueueManager = new ReviewQueueManager(this.reviewWords, this.introductionBatchSize, this.testsBetweenIntroduction);

            const firstWordReview: WordReview | null = this.reviewQueueManager.getCurrent();
            if (firstWordReview !== null) {
                this.setCurrentWordReview(firstWordReview);
                
            }

            this.showSummary = false;
            this.reviewComplete = false;
            this.totalTimeMs = 0;
            this.startTimeMs = new Date().valueOf();
        }
    }

    onReviewTimerComplete(): void {
        this.processCurrentReviewPrompt()
    }

    onReviewResult(result: ReviewTestResult): void {
        this.currentResult = result;
        
        this.currentTestTime = this.currentReviewTimeMs + (new Date().valueOf() - this.reviewStartTimeMs);
        this.countdownTimer.stop();

        const reviewTimeMs = this.currentTestTime + this.reviewQueueManager.getTotalTimeSoFar();
        if (this.currentResult.isCorrect && (this.getAllowedTimeSec() > 0) && (this.getAllowedTimeSec() * 1000 * CORRECT_NEAR_MISS_MULTIPLIER) < reviewTimeMs) {
            this.currentResult.isNearMiss = true;
            this.reviewPrompt.updateResult(this.currentResult);
        }
        
        if (this.selectedAudioPath) {
            this.wordAudioPlayer.playAudio();
        }
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
        setTimeout(() => this.pauseButton?._elementRef?.nativeElement.blur(), 0);
    }

    onNext(): void {
        this.deferCurrentTest();
    }

    onSkip(): void {
        if (this.currentResult) {        // make sure current test is included if result was already determined
           this.advanceToNext();
        }

        if (this.currentWordReview) {    // No need to do anything if queue was exhausted as it will automatically show summary
            if (!this.isPaused) {
                this.togglePause();
            }
            this.showReviewSummary();
        }
    }

    onResumeReview(): void {
        this.showSummary = false;
        this.showOveviewWordFromSummary = null;
        this.wordToEdit = null;

        if (this.isPaused) {
            this.togglePause();
        }
    }
    
    onClose(): void {
        this.closeReviewContainer();
    }

    onEditWord(wordToEdit: Word): void {
        this.wordToEdit = wordToEdit;
    }

    onViewSummary(word: Word): void {
        this.showOveviewWordFromSummary = word;
    }

    onEditComplete(newWord: Word): void {
        this.updateReviewedWordResultsWord(newWord);
        this.updateCurrentReviewWordIfNecessary(newWord);
        this.reviewQueueManager.updateWord(newWord);
        if (this.showOveviewWordFromSummary) {
            this.showOveviewWordFromSummary = newWord;
        }

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
        this.countdownTimer.start(this.getAllowedTimeSec());
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

        this.setAudio(!this.playAudioOnLoad(wordReview.reviewMode));
    }

    private updateProgressBar(): void {
        const progress = this.reviewQueueManager.getProgess()
        this.percentComplete = progress.completedTests / progress.totalTests * 100;
    }

    private setAudio(preload: boolean): void {
        if (this.currentWordReview.word.audioFiles && this.currentWordReview.word.audioFiles.length > 0) {
            const selectedAudioFileIndex = Math.floor(Math.random() * this.currentWordReview.word.audioFiles.length);
            if (this.selectedAudioPath === this.currentWordReview.word.audioFiles[selectedAudioFileIndex] && this.audioWordId === this.currentWordReview.word.id) {
                if (!this.preloadAudio) {
                    // If the audio is not changing, just play the existing audio, no need to try and change it
                    this.wordAudioPlayer.playAudio();
                }
            } else {
                this.selectedAudioPath = this.currentWordReview.word.audioFiles[selectedAudioFileIndex];
                this.audioWordId = this.currentWordReview.word.id;
                this.preloadAudio = preload;
            }
        } else {
            this.audioWordId = ""
            this.selectedAudioPath = "";
            this.preloadAudio = false;
        }
    }

    private showReviewSummary(): void {
        this.updateProgressBar();

        this.totalWordCount = 0;
        this.correctWordCount = 0;
        this.reviewedWordResults = [];
        this.totalTimeMs = (new Date().valueOf() - this.startTimeMs) - this.totalPauseTimeMs;

        this.reviewQueueManager.getProcessedItems().forEach(wordResult => { 
            this.reviewedWordResults.push(wordResult);
            this.totalWordCount++;
            if (wordResult.reviewTestResult.isCorrect) { 
                this.correctWordCount++;
            }
        });

        this.showSummary = true;

        if (this.reviewedWordResults.length === 0) {
            this.closeReviewContainer();
        }
    }

    private processCurrentReviewPrompt(): void {
        if (this.showSummary) {
            if (this.showOveviewWordFromSummary) {
                this.showOveviewWordFromSummary = null;
            } else {
                this.closeReviewContainer();
            }
        }

        if (!this.isPaused) {
            if (!this.currentWordReview) {
                this.closeReviewContainer();
            } else if (this.reviewPrompt) {
                this.reviewPrompt.processNext();
            }
        }
    }

    private deferCurrentTest(): void {
        if (!this.isPaused && this.currentWordReview && this.reviewPrompt && this.reviewPrompt.canDefer()) {
            const nextWordReview: WordReview | null = this.reviewQueueManager.deferAndGetNext(this.currentReviewTimeMs + (new Date().valueOf() - this.reviewStartTimeMs));

            if (nextWordReview !== null) {
                if (this.currentWordReview === nextWordReview) {   // Need to manually reset the fields if the test is not changing
                    this.reviewPrompt.resetFields()
                }

                this.wordAudioPlayer.stopAudio();
                this.setCurrentWordReview(nextWordReview);
            }
        }
    }

    private advanceToNext(): void {
        if (this.currentWordReview.recordResult && this.currentResult) {
            const reviewTimeMs = this.currentTestTime + this.reviewQueueManager.getTotalTimeSoFar();
            this.saveTestResult(this.currentWordReview, this.currentResult, reviewTimeMs, false);
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
            this.currentTestTime = 0;

            if (nextWordReview !== null) {
                this.setCurrentWordReview(nextWordReview);
            } else {
                this.reviewComplete = true;
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
            this.totalPauseTimeMs += new Date().valueOf() - this.pauseTimeStartMs;
            if (this.advanceOnUnpause) {
                this.advanceOnUnpause = false;
                this.advanceToNext();
            } else {
                this.reviewPrompt.focus();
            }
        } else {
            this.isPaused = true;
            this.pauseButtonIcon = PAUSE_BUTTON_ICON_PAUSED;
            this.pauseTimeStartMs = new Date().valueOf();
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
        return reviewMode.isOverview();
    }

    private getAllowedTimeSec(): number {
        if (this.currentWordReview && this.currentWordReview.allowedTimeSec) {
            return this.currentWordReview.allowedTimeSec * this.timeModifier;
        }

        return 0;
    }
}