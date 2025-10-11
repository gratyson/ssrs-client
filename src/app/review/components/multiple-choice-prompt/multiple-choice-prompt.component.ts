import { Component, EventEmitter, Input, Output, QueryList, SimpleChanges, ViewChildren } from "@angular/core";
import { MatButton, MatButtonModule } from "@angular/material/button";
import { ReviewTestResult } from "../../model/review-session";

const ACCEPT_NULL_ANSWER_WAIT_TIME_MS: number = 3000;

@Component({
    selector: "multiple-choice-prompt",
    templateUrl: "multiple-choice-prompt.html",
    styleUrl: "multiple-choice-prompt.css",
    imports: [MatButtonModule],
    host: { ["(document:keydown)"]: "onKeypress($event)" }
})
export class MultipleChoicePromptComponent {

    readonly BUTTON_NAME_PREFIX: string = "multiple-choice-button-";
    readonly SELECTED_BUTTON_CLASS: string = "multiple-choice-button-selected";

    @ViewChildren("multipleChoiceButton") multipleChoiceButtons: QueryList<MatButton>;

    @Input() options: string[] = [];
    @Input() correctAnswer: string = "";
    @Input() optionFont: string = "";
    @Input() disabled: boolean = false;

    @Output() multipleChoiceTestResult: EventEmitter<ReviewTestResult> = new EventEmitter<ReviewTestResult>();

    multipleChoiceOptions: string[] = [];
    multipleChoiceOptionClass: string[] = [];
    multipleChoiceBackgroundColor: string[] = [];
    
    private correctAnswerIndex: number = -1;
    private currentlySelectedIndex: number = -1;
    private testComplete: boolean = false;
    private startTimeMs: number = 0;

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("options") || simpleChanges.hasOwnProperty("correctAnswer")) {
            if (this.options && this.options.length > 0 && this.correctAnswer) {
                this.multipleChoiceOptions = [...this.options]; 
                this.multipleChoiceOptionClass = Array<string>(this.options.length).fill("");
                this.multipleChoiceBackgroundColor = Array<string>(this.options.length).fill("");

                if(this.multipleChoiceOptions.indexOf(this.correctAnswer) < 0) {
                    this.multipleChoiceOptions.push(this.correctAnswer);
                    this.multipleChoiceOptionClass.push("");
                }

                this.multipleChoiceOptions.sort(() => Math.random() - .5);  // shuffle
                for(let index = 0; index < this.multipleChoiceOptions.length; index++) {
                    if (this.multipleChoiceOptions[index] === this.correctAnswer) {
                        this.correctAnswerIndex = index;
                        break;
                    }
                }

                this.startTimeMs = new Date().valueOf();
                this.testComplete = false;
                this.setSelectedIndex(-1);
            }
        }
    }

    public processTest(): void {
        this.processAnswer(this.currentlySelectedIndex);
    }

    private processAnswer(selectedIndex: number): void {
        if (!this.testComplete && !this.disabled && (selectedIndex >= 0 || this.isNullAnswerAllowed())) {
            this.testComplete = true;

            if (selectedIndex === this.correctAnswerIndex) {
                this.multipleChoiceOptionClass[this.correctAnswerIndex] = "correct-answer-background";
                this.multipleChoiceTestResult.emit({ isCorrect: true, isNearMiss: false });
            } else {
                if (selectedIndex >= 0) {
                    this.multipleChoiceOptionClass[selectedIndex] = "incorrect-answer-background";
                } 
                this.multipleChoiceOptionClass[this.correctAnswerIndex] = "correct-answer-near-miss-background";
                this.multipleChoiceTestResult.emit({ isCorrect: false, isNearMiss: false });
            }

            this.unfocusButton(selectedIndex);
        }
    }

    onClick(selectedIndex: number): void {   
        this.processAnswer(selectedIndex);
    }

    onKeypress(event: KeyboardEvent): void {
        if (!event.altKey && !event.ctrlKey && !event.shiftKey) {
            if (event.key >= "1" && event.key <= (this.multipleChoiceOptions.length > 9 ? "9" : this.multipleChoiceOptions.length.toString())) {
                this.processAnswer(Number.parseInt(event.key) - 1);
            } else if (event.key === "ArrowLeft") {
                this.shiftFocusLeft();
            } else if (event.key === "ArrowRight") {
                this.shiftFocusRight();
            } else if (event.key === "ArrowUp") {
                this.shiftFocusUp();
            } else if (event.key === "ArrowDown") {
                this.shiftFocusDown();
            }
        }
    }

    private isNullAnswerAllowed(): boolean {
        return (new Date().valueOf() - this.startTimeMs) > ACCEPT_NULL_ANSWER_WAIT_TIME_MS;
    }

    private shiftFocusLeft(): void {
        if(this.currentlySelectedIndex >= 0) {
            this.shiftHorizontal(this.currentlySelectedIndex);   // only two columns, so any horizontal movement just toggles between them
        } else if (this.multipleChoiceOptions.length > 1) {
            this.setSelectedIndex(1);
        } else {
            this.setSelectedIndex(0);
        }
    }
    
    private shiftFocusRight(): void {
        if(this.currentlySelectedIndex >= 0) {
            this.shiftHorizontal(this.currentlySelectedIndex);   // only two columns, so any horizontal movement just toggles between them
        } else {
            this.setSelectedIndex(0);
        }
    }

    private shiftHorizontal(curFocusIndex: number): void {
        this.setSelectedIndex(curFocusIndex + 1 - (((curFocusIndex) % 2) * 2));   // +1 if index is even, -1 if index is odd
    }
    
    private shiftFocusUp(): void {
        if (this.currentlySelectedIndex >= 0) {
            let nextFocusIndex: number = this.currentlySelectedIndex - 2;
            if (nextFocusIndex < 0) {
                nextFocusIndex = this.multipleChoiceOptions.length - 1 - ((this.currentlySelectedIndex + 1) % 2);
            }
            this.setSelectedIndex(nextFocusIndex);
        } else {
            this.setSelectedIndex(this.multipleChoiceOptions.length - 1 - ((this.multipleChoiceOptions.length + 1) % 2));
        }
    }

    private shiftFocusDown(): void {
        if (this.currentlySelectedIndex >= 0) {
            let nextFocusIndex: number = this.currentlySelectedIndex + 2;
            if (nextFocusIndex >= this.multipleChoiceOptions.length) {
                nextFocusIndex = this.currentlySelectedIndex % 2;
            }
            this.setSelectedIndex(nextFocusIndex);
        } else {
            this.setSelectedIndex(0);
        }

    }

    private setSelectedIndex(index: number): void {
        if (this.currentlySelectedIndex >= 0) {
            let buttonElement: HTMLButtonElement = this.multipleChoiceButtons.toArray()[this.currentlySelectedIndex]._elementRef.nativeElement as HTMLButtonElement;
            buttonElement.classList.remove(this.SELECTED_BUTTON_CLASS);
            this.unfocusButton(this.currentlySelectedIndex);
        }
        
        this.currentlySelectedIndex = index;
        if (index >= 0) {
            let buttonElement: HTMLButtonElement = this.multipleChoiceButtons.toArray()[this.currentlySelectedIndex]._elementRef.nativeElement as HTMLButtonElement;
            buttonElement.classList.add(this.SELECTED_BUTTON_CLASS);
        }
    }

    private unfocusButton(index: number) {
        if (index > 0) {
            let buttonElement: HTMLButtonElement = this.multipleChoiceButtons.toArray()[index]._elementRef.nativeElement as HTMLButtonElement;
            buttonElement.blur();
        }
    }
}