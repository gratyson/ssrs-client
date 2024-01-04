import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from "@angular/core";
import { CORRECT_ANSWER_COLOR, CORRECT_ANSWER_NEAR_MISS_COLOR, INCORRECT_ANSWER_COLOR, INCORRECT_ANSWER_NEAR_MISS_COLOR } from "../../model/color-config";
import { ReviewMode, ReviewTestResult, ReviewType } from "../../model/review-session";
import { MeasureStringDistance } from "../../../util/string-distance";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";

const ACCEPT_EMPTY_TYPING_TEST_WAIT_TIME_MS: number = 3000;

@Component({
    selector: "typing-test-prompt",
    templateUrl: "typing-test-prompt.html",
    styleUrl: "typing-test-prompt.css",
    standalone: true,
    imports:  [MatInputModule, MatButtonModule ],
    host: { ["(document:wheel)"]: "onMousewheel($event)" }
})
export class TypingTestPromptComponent {
    
    @ViewChild("typingTestInput") typingTestInput: ElementRef<HTMLInputElement>;

    @Input() correctAnswer: string = "";
    @Input() typingTestButtons: string[] = [];
    @Input() promptFont: string = "";
    @Input() reviewMode: ReviewMode;
    @Input() disabled: boolean = false;

    @Output() typingTestResult: EventEmitter<ReviewTestResult> = new EventEmitter<ReviewTestResult>();

    typingTestButtonValues: string[] = [];
    resultClass: string = "";
    typingEnabled: boolean = true;

    private startTimeMs: number = 0;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("correctAnswer") || simpleChanges.hasOwnProperty("typingTestButtons") || simpleChanges.hasOwnProperty("reviewMode")) {
            this.typingTestButtonValues = [...this.typingTestButtons];

            let shuffleRequired: boolean = false;
            for(let correctValueChar of [...this.correctAnswer]) {
                if (this.typingTestButtonValues.indexOf(correctValueChar) < 0) {
                    this.typingTestButtonValues.push(correctValueChar);
                    shuffleRequired = true;
                }
            }
            if (shuffleRequired) {
                this.shuffleTypingButtons();
            }

            this.initializeFields();
        }
    }

    public processTest(): void {
        this.processAnswer();
    }

    public focus(): void {
        setTimeout(() => {
            this.typingTestInput.nativeElement.focus();
         }, 0);
    }

    public updateResult(result: ReviewTestResult): void {
        this.resultClass = this.getResultClass(result);
    }

    onTypingTestKeyup(event: KeyboardEvent): void {
        this.checkForCorrectAnswer();
    }

    onTypingButtonClick(buttonVal: string): void {       
        if (this.typingEnabled && this.typingTestInput && this.typingTestInput.nativeElement.selectionStart != null && this.typingTestInput.nativeElement.selectionEnd != null) {            
            this.typingTestInput.nativeElement.setRangeText(buttonVal, this.typingTestInput.nativeElement.selectionStart, this.typingTestInput.nativeElement.selectionEnd, "end");
            this.typingTestInput.nativeElement.focus();
            this.checkForCorrectAnswer();
        }
    }

    onMousewheel(event: WheelEvent): void {
        if (event.deltaY > 0) {
            this.adjustCursorPos(-1);
        } else if (event.deltaY < 0) {
            this.adjustCursorPos(1);
        }
    }

    private adjustCursorPos(adjustment: number): void {
        const curAnswer = this.typingTestInput?.nativeElement.value;
        if (curAnswer) {
            const cursorPos: number = this.typingTestInput.nativeElement.selectionStart ? this.typingTestInput.nativeElement.selectionStart : 0;
            const newPos: number = Math.max(Math.min(cursorPos + adjustment, curAnswer.length), 0);
            
            this.typingTestInput.nativeElement.setSelectionRange(newPos, newPos);
        }
    }

    private checkForCorrectAnswer(): void {
        const curAnswer = this.typingTestInput?.nativeElement.value;
        if (curAnswer === this.correctAnswer) {
            this.processAnswer();
        }
    }

    private initializeFields(): void {
        this.typingEnabled = true;
        this.startTimeMs = new Date().valueOf();
        this.resultClass = "";
        if (this.typingTestInput) {
            this.typingTestInput.nativeElement.value = "";
            setTimeout(() => {
                this.typingTestInput.nativeElement.focus();
             }, 0);   // need to trigger asynchronously, otherwise will lose focus when changes are rendered
        }
    }

    private processAnswer(): void {
        const answer = this.typingTestInput?.nativeElement.value;
        if (this.allowProcessAnswer(answer)) {
            // Disabling an input element while IME composition is active can cause issues with 
            // the IME on certain browsers (tested specifically with MS IME and Firefox), so 
            // end composition before processing the answer to avoid issues.
            this.clearImeComposition();

            let result: ReviewTestResult;
            if (answer === this.correctAnswer) {
                // Correct near-miss is based on total test time and gets updated as appropriate in the review container component
                result = { isCorrect: true, isNearMiss: false }
            }
            else {  
                result = { isCorrect: false, isNearMiss: this.isIncorrectNearMiss(answer, this.correctAnswer) };
            }

            this.resultClass = this.getResultClass(result);
            this.typingEnabled = false;
            this.typingTestResult.emit(result);
        }
    }

    private clearImeComposition(): void {
        if (this.typingTestInput) {
            const answer = this.typingTestInput?.nativeElement.value;
            this.typingTestInput.nativeElement.value = "";
            this.typingTestInput.nativeElement.value = answer;
        }
    }

    private isIncorrectNearMiss(answer: string, correctAnswer: string): boolean {
        if (answer) {
            const distance: number = MeasureStringDistance(answer, correctAnswer);
            if (distance === 1 || distance <= correctAnswer.length / 2.0) {
                return true;
            }
        }

        return false;
    }

    private allowProcessAnswer(answer: string): boolean {
        if (!answer) {
            const testTimeMs: number = new Date().valueOf() - this.startTimeMs;
            if (testTimeMs < ACCEPT_EMPTY_TYPING_TEST_WAIT_TIME_MS) {
                return false;
            }
        }

        return true;
    }

    private shuffleTypingButtons(): void {
        this.typingTestButtonValues.sort(() => Math.random() - .5);
    }

    private getResultClass(result: ReviewTestResult): string {
        if (result.isCorrect) {
            if (result.isNearMiss) {
                return "correct-answer-near-miss-background";
            } 
            return "correct-answer-background";
        } else if (result.isNearMiss) {
            return "incorrect-answer-near-miss-background";
        }   
        return "incorrect-answer-background";
    }
}
