import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { LexiconReviewHistory, TestHistory } from "../../model/lexicon";
import { Language, TestRelationship } from "../../../language/language";
import { LanguageService } from "../../../language/language-service";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { DatePipe } from "@angular/common";
import { DurationPipe } from "../../../util/duration/duration.pipe";

@Component({
    selector: "view-review-history",
    templateUrl: "view-review-history.html",
    styleUrl: "view-review-history.css",
    imports: [MatIconModule, MatButtonModule, DatePipe, DurationPipe]
})
export class ViewReviewHistoryComponent {

    private languageService: LanguageService = inject(LanguageService);

    @Input() reviewHistory: LexiconReviewHistory;
    @Input() language: Language;

    @Output() closeHistory: EventEmitter<void> = new EventEmitter<void>();

    overallTestHistory: TestHistory = { totalTests: 0, correct: 0, correctStreak: 0 };
    nextRelation: TestRelationship | null = null;

    public ngOnInit(): void {
        this.calcOverallTestHistory();
    }

    onBackClick(event: Event): void {
        this.closeHistory.emit();
    }

    private calcOverallTestHistory(): void {
        this.overallTestHistory = { totalTests: 0, correct: 0, correctStreak: 0 };
        for(let testRelation of this.language.testRelationships) {
            if (this.reviewHistory.nextTestRelationId === testRelation.id) {
                this.nextRelation = testRelation;
            }

            if (this.reviewHistory.testHistory[testRelation.id]) {
                this.overallTestHistory = {
                    totalTests: this.overallTestHistory.totalTests + this.reviewHistory.testHistory[testRelation.id].totalTests,
                    correct: this.overallTestHistory.correct + this.reviewHistory.testHistory[testRelation.id].correct,
                    correctStreak: this.overallTestHistory.correctStreak + this.reviewHistory.testHistory[testRelation.id].correctStreak
                }
            }
        } 
    }
}