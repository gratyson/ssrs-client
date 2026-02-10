import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { LexiconWordRowEditComponent } from "../../../lexicon/components/lexicon-word-row/lexicon-word-row-edit";
import { Language } from "../../../language/language";
import { Word } from "../../../lexicon/model/word";
import { LexiconWordRowHeaderComponent } from "../../../lexicon/components/lexicon-word-row/lexicon-word-row-header";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { WordReviewHistory } from "../../../lexicon/model/lexicon";
import { ViewReviewHistoryComponent } from "../../../lexicon/components/view-review-history/view-review-history.component";
import { WordReviewHistoryClient } from "../../../client/word-review-history-client";

@Component({
    selector: "single-word-edit",
    templateUrl: "single-word-edit.html",
    styleUrl: "single-word-edit.css",
    imports: [LexiconWordRowEditComponent, LexiconWordRowHeaderComponent, MatIconModule, MatButtonModule, ViewReviewHistoryComponent]
})
export class SingleWordEditComponent {

    private wordReviewHistoryClient: WordReviewHistoryClient = inject(WordReviewHistoryClient);

    @Input() language: Language;
    @Input() lexiconId: string;
    @Input() word: Word;

    @Output() editComplete: EventEmitter<Word> = new EventEmitter<Word>();
    @Output() wordChange: EventEmitter<Word> = new EventEmitter<Word>();

    reviewHistory: WordReviewHistory;
    showHistory: boolean = false;

    public ngOnInit(): void {
        this.wordReviewHistoryClient.getWordReviewHistoryBatch(this.lexiconId, [this.word.id]).subscribe((reviewHistoryList) => {
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

    onViewHistory(reviewHistory: WordReviewHistory): void {
        this.showHistory = true;
    }

    onCloseHistory(): void {
        this.showHistory = false;
    }
}