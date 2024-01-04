import { Injectable, inject } from "@angular/core";
import { EMPTY_WORD_FILTER_OPTIONS, WordClient, WordFilterOptions } from "../../client/word-client";
import { Word } from "../model/word";
import { Language } from "../../language/language";
import { LexiconClient } from "../../client/lexicon-client";
import { LexiconReviewHistory, TestHistory } from "../model/lexicon";
import { Observable, concat, flatMap, map, mergeMap, of } from "rxjs";
import { ReviewSessionClient } from "../../client/review-session-client";

const LOAD_WORDS_BATCH_SIZE = 500;

@Injectable({ providedIn: "root" })
export class WordWriter {

    private wordClient: WordClient = inject(WordClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);

    public GenerateLexiconWordsTsvBlob(language: Language, lexiconId: string, includeHistory: boolean = false, filterOptions: WordFilterOptions = EMPTY_WORD_FILTER_OPTIONS): Observable<Blob> {
        return this.loadWords(language, lexiconId, 0, includeHistory, filterOptions).pipe(map((lines) => {
            return new Blob([lines.join("\n")], { type: "text/plain" });
        }));
    }

    private loadWords(language: Language, lexiconId: string, offset: number, includeHistory: boolean, filterOptions: WordFilterOptions): Observable<string[]> {
        
        return this.wordClient.loadWordsBatch(lexiconId, LOAD_WORDS_BATCH_SIZE, offset, filterOptions).pipe(mergeMap((words) => {
            return this.loadReviewHistoryIfNeeded(lexiconId, words, includeHistory).pipe(mergeMap((reviewHistoryByWordId) => {
                let lines: string[] = this.writeWords(language, words, reviewHistoryByWordId);
    
                return this.loadAdditionalWordsIfNeeded(language, lexiconId, words, offset, includeHistory, filterOptions).pipe(map((additionalLines) => lines.concat(additionalLines)));
            }));
        }));
    }

    private loadAdditionalWordsIfNeeded(language: Language, lexiconId: string, lastWords: Word[], offset: number, includeHistory: boolean, filterOptions: WordFilterOptions): Observable<string[]> {
        if (lastWords.length === LOAD_WORDS_BATCH_SIZE) {
            return this.loadWords(language, lexiconId, offset + LOAD_WORDS_BATCH_SIZE, includeHistory, filterOptions);
        } 
        return of([]);
    }

    private loadReviewHistoryIfNeeded(lexiconId: string, words: Word[], includeHistory: boolean) {
        if (includeHistory) {
            return this.reviewSessionClient.getLexiconReviewHistoryBatch(lexiconId, words.map(word => word.id)).pipe(map((reviewHistories) => this.indexByWordId(reviewHistories)));
        }

        return of({});
    }

    private writeWords(language: Language, words: Word[], reviewHistoryByWordId: { [k:string]: LexiconReviewHistory}): string[] {
        let lines: string[] = [];

        for (let word of words) {
            let line: string = this.generateWordTsv(language, word); 

            if (reviewHistoryByWordId[word.id] && reviewHistoryByWordId[word.id].learned) {                
                line += "\t";
                line += this.generateReviewHistoryTsv(reviewHistoryByWordId[word.id]);
            }

            lines.push(line);
        }

        return lines;
    }

    private generateWordTsv(language: Language, word: Word): string {
        let line: string = "";

        for(let languageElement of language.validElements) {
            if (word.elements[languageElement.id]) {
                line += word.elements[languageElement.id];
            }
            line += "\t";
        }

        if (word.attributes) {
            line += word.attributes;
        }

        return line;
    }

    private generateReviewHistoryTsv(reviewHistory: LexiconReviewHistory): string {
        let line: string = "";
        
        if(reviewHistory.mostRecentTestTime) {
            line += reviewHistory.mostRecentTestTime.valueOf();
        }
        line += "\t";
    
        if(reviewHistory.currentTestDelay) {
            line += reviewHistory.currentTestDelay.toMillis();
        }
        line += "\t";

        if(reviewHistory.nextTestRelationId) {
            line += reviewHistory.nextTestRelationId;
        }
        line += "\t";

        if(reviewHistory.nextTestTime) {
            line += reviewHistory.nextTestTime.valueOf();
        }
        line += "\t";

        if(reviewHistory.currentBoost) {
            line += reviewHistory.currentBoost;
        }
        line += "\t";

        if(reviewHistory.currentBoostExpirationDelay) {
            line += reviewHistory.currentBoostExpirationDelay.toMillis()
        }
        
        for(let testRelationId of Object.keys(reviewHistory.testHistory)) {
            line += "\t";
            line += this.generateTestHistoryString(testRelationId, reviewHistory.testHistory[testRelationId]);
        }

        return line;
    }

    private generateTestHistoryString(testRelationId: string, testHistory: TestHistory): string {
        return testRelationId + "," + testHistory.totalTests + "," + testHistory.correct + "," + testHistory.correctStreak;
    }

    private indexByWordId(reviewHistories: LexiconReviewHistory[]): { [k:string]: LexiconReviewHistory} {
        let reviewHistoryByWordId: { [k:string]: LexiconReviewHistory} = {};

        for(let reviewHistory of reviewHistories) {
            reviewHistoryByWordId[reviewHistory.wordId] = reviewHistory;
        }

        return reviewHistoryByWordId;
    }
}