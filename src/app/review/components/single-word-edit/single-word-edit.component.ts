import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { LexiconWordRowEditComponent } from "../../../lexicon/components/lexicon-word-row/lexicon-word-row-edit";
import { Language } from "../../../language/language";
import { Word } from "../../../lexicon/model/word";
import { LexiconWordRowHeaderComponent } from "../../../lexicon/components/lexicon-word-row/lexicon-word-row-header";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { LexiconReviewHistory } from "../../../lexicon/model/lexicon";
import { LexiconClient } from "../../../client/lexicon-client";
import { ViewReviewHistoryComponent } from "../../../lexicon/components/view-review-history/view-review-history.component";
import { ReviewSessionClient } from "../../../client/review-session-client";

@Component({
    selector: "single-word-edit",
    templateUrl: "single-word-edit.html",
    styleUrl: "single-word-edit.css",
    standalone: true,
    imports: [ LexiconWordRowEditComponent, LexiconWordRowHeaderComponent, MatIconModule, MatButtonModule, ViewReviewHistoryComponent ]
})
export class SingleWordEditComponent {

    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);

    @Input() language: Language;
    @Input() lexiconId: string;
    @Input() word: Word;

    @Output() editComplete: EventEmitter<Word> = new EventEmitter<Word>();
    @Output() wordChange: EventEmitter<Word> = new EventEmitter<Word>();

    reviewHistory: LexiconReviewHistory;
    showHistory: boolean = false;

    public ngOnInit(): void {
        this.reviewSessionClient.getLexiconReviewHistoryBatch(this.lexiconId, [this.word.id]).subscribe((reviewHistoryList) => {
            if (reviewHistoryList && reviewHistoryList.length > 0) {
                this.reviewHistory = reviewHistoryList[0];
            }
        });
    }

    onEditComplete(): void {
        this.editComplete.emit(this.word);
    }

    onWordChange(word: Word): void {
        this.word = word;
        this.wordChange.emit(word);
    }

    onViewHistory(reviewHistory: LexiconReviewHistory): void {
        this.showHistory = true;
    }

    onCloseHistory(): void {
        this.showHistory = false;
    }
}