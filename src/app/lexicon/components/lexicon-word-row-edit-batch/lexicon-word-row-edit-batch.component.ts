import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild, inject } from "@angular/core";
import { EMPTY_WORD_FILTER_OPTIONS, WordClient, WordFilterOptions } from "../../../client/word-client";
import { LexiconWordRowEditComponent} from "../lexicon-word-row/lexicon-word-row-edit";
import { environment } from "../../../../environments/environment";
import { Word } from "../../model/word";
import { Language } from "../../../language/language";
import { MatFormFieldModule } from "@angular/material/form-field";
import { LexiconReviewHistory } from "../../model/lexicon";
import { ReviewSessionClient } from "../../../client/review-session-client";

@Component({
    selector: "word-row-edit-batch", 
    templateUrl: "lexicon-word-row-edit-batch.html",
    styleUrl: "lexicon-word-row-edit-batch.css",
    standalone: true,
    imports: [ LexiconWordRowEditComponent, LexiconWordRowEditBatchComponent, MatFormFieldModule ]
})
export class LexiconWordRowEditBatchComponent {

    private wordClient: WordClient = inject(WordClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);

    @ViewChild(LexiconWordRowEditBatchComponent) childWordRowEditBatch: LexiconWordRowEditBatchComponent;

    @Input() language: Language;
    @Input() lexiconId: string;
    @Input() offset: number = 0;
    @Input() newWordOffsetAdjustment: number;
    @Input() currentFilters: WordFilterOptions = EMPTY_WORD_FILTER_OPTIONS;

    @Input() newWords: Word[] = [];
    @Output() newWordsChange: EventEmitter<Word[]> = new EventEmitter<Word[]>();

    @Input() reviewHistoryView: LexiconReviewHistory | null = null;
    @Output() reviewHistoryViewChange: EventEmitter<LexiconReviewHistory | null> = new EventEmitter<LexiconReviewHistory | null>();

    words: Word[] = [];
    reviewHistoryByWordId: { [k:string]: LexiconReviewHistory } = {};
    batchSize: number = environment.WORD_BATCH_LOAD_SIZE;
    nextOffset: number = 0;
    hasMore: boolean;

    private initialized: boolean = false;

    public ngOnInit(): void {
        this.nextOffset = this.offset + this.batchSize;
        
        this.loadWords();

        this.initialized = true;
    }

    public ngOnChanges(changes: SimpleChanges): void {
        if (this.initialized) {
            if (changes.hasOwnProperty("currentFilters")) {
                this.loadWords();
            }
            if (changes.hasOwnProperty("newWords")) {
                this.newWordOffsetAdjustment = this.newWords.length;
            }
        }
    }

    public updateAudio(newAudioFileNames: { [k:string]: string[] }): void {
        this.updateAudioOnList(newAudioFileNames, this.words);
        this.updateAudioOnList(newAudioFileNames, this.newWords);

        this.childWordRowEditBatch?.updateAudio(newAudioFileNames);
    }

    public reloadReviewHistory(): void {
        this.loadReviewHistories();
        
        if(this.childWordRowEditBatch) {
            this.childWordRowEditBatch.reloadReviewHistory();
        }
    }

    public mergeNewReviewHistory(newReviewHistory: { [k:string]: LexiconReviewHistory }): void {
        this.reviewHistoryByWordId = { ...this.reviewHistoryByWordId, ...newReviewHistory };
    }

    onDeleteWord(word: Word) {
        this.wordClient.deleteWord(this.lexiconId, word.id).subscribe(() => {
            let index: number = this.newWords.indexOf(word);
            if (index >= 0) {
                this.newWords.splice(index, 1);
                this.newWordsChange.emit(this.newWords);
                this.nextOffset--;
            } else {
                index = this.words.indexOf(word);
                if (index >= 0) {
                    this.words.splice(index, 1);
                    this.nextOffset--;
                }
            }
        });
    }

    onViewHistory(reviewHistory: LexiconReviewHistory): void {
        this.setReviewHistoryView(reviewHistory);
    }

    onReviewHistoryViewChange(reviewHistoryView: LexiconReviewHistory | null): void {
        this.setReviewHistoryView(reviewHistoryView);
    }

    private loadWords(): void {
        if (this.batchSize) {
            this.words = [];

            this.wordClient.loadWordsBatch(this.lexiconId, this.batchSize, this.offset + this.newWordOffsetAdjustment, this.currentFilters).subscribe(words => {
                this.words = words;
                this.hasMore = words.length === this.batchSize;
                this.loadReviewHistories();
            });

            if(this.newWords.length > 0) {
                this.setNewWords([]);
            }
        }
    }

    private setNewWords(newWords: Word[]) {
        this.newWords = [];
        this.newWordsChange.emit(newWords);
    }

    private updateAudioOnList(newAudioFileNames: { [k:string]: string[] }, wordList: Word[]): void {
        for(let index = 0; index < wordList.length; index++) {
            if (newAudioFileNames[wordList[index].id]) {
                // Need to update object reference to for changes to be recognized by child components
                let word = Object.assign({}, wordList[index]);
                word.audioFiles = [...newAudioFileNames[word.id]];
                wordList[index] = word;
            }
        }
    }

    private setReviewHistoryView(reviewHistoryView: LexiconReviewHistory | null): void {
        this.reviewHistoryView = reviewHistoryView;
        this.reviewHistoryViewChange.emit(reviewHistoryView);
    }

    private loadReviewHistories(): void {
        this.reviewSessionClient.getLexiconReviewHistoryBatch(this.lexiconId, this.words.map<string>(word => word.id)).subscribe((reviewHistoryList) => {
            this.reviewHistoryByWordId = {};

            for(let reviewHistory of reviewHistoryList) {
                this.reviewHistoryByWordId[reviewHistory.wordId] = reviewHistory;
            }
        });
    }
}
