import { Injectable, inject } from "@angular/core";
import { EMPTY_WORD_FILTER_OPTIONS, WordClient, WordFilterOptions } from "../../client/word-client";
import { Word } from "../model/word";
import { Language } from "../../language/language";
import { WordReviewHistory, TestHistory } from "../model/lexicon";
import { Observable, map, mergeMap, of } from "rxjs";
import { WordReviewHistoryClient } from "../../client/word-review-history-client";

const LOAD_WORDS_BATCH_SIZE = 500;

@Injectable({ providedIn: "root" })
export class WordWriter {

    private wordClient: WordClient = inject(WordClient);
    private wordReviewHistoryClient: WordReviewHistoryClient = inject(WordReviewHistoryClient);

    public GenerateLexiconWordsTsvBlob(language: Language, lexiconId: string, includeHistory: boolean = false, filterOptions: WordFilterOptions = EMPTY_WORD_FILTER_OPTIONS): Observable<Blob> {
        return this.loadWords(language, lexiconId, 0, null, includeHistory, filterOptions).pipe(map((lines) => {
            return new Blob([lines.join("\n")], { type: "text/plain" });
        }));
    }

    private loadWords(language: Language, lexiconId: string, offset: number, lastWord: Word | null, includeHistory: boolean, filterOptions: WordFilterOptions): Observable<string[]> {
        
        return this.wordClient.loadWordsBatch(lexiconId, LOAD_WORDS_BATCH_SIZE, offset, lastWord, filterOptions).pipe(mergeMap((words) => {
            return this.loadReviewHistoryIfNeeded(lexiconId, words, includeHistory).pipe(mergeMap((reviewHistoryByWordId) => {
                let lines: string[] = this.writeWords(language, words, reviewHistoryByWordId);
    
                return this.loadAdditionalWordsIfNeeded(language, lexiconId, words, offset, includeHistory, filterOptions).pipe(map((additionalLines) => lines.concat(additionalLines)));
            }));
        }));
    }

    private loadAdditionalWordsIfNeeded(language: Language, lexiconId: string, lastWords: Word[], offset: number, includeHistory: boolean, filterOptions: WordFilterOptions): Observable<string[]> {
        if (lastWords.length === LOAD_WORDS_BATCH_SIZE) {
            return this.loadWords(language, lexiconId, offset + LOAD_WORDS_BATCH_SIZE, lastWords[lastWords.length - 1], includeHistory, filterOptions);
        } 
        return of([]);
    }

    private loadReviewHistoryIfNeeded(lexiconId: string, words: Word[], includeHistory: boolean): Observable<{ [k:string]: WordReviewHistory }> {
        if (includeHistory) {
            return this.wordReviewHistoryClient.getWordReviewHistoryBatch(lexiconId, words.map(word => word.id)).pipe(map((reviewHistories) => this.indexByWordId(reviewHistories)));
        }

        return of({});
    }

    private writeWords(language: Language, words: Word[], reviewHistoryByWordId: { [k:string]: WordReviewHistory} ): string[] {
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

    private generateReviewHistoryTsv(reviewHistory: WordReviewHistory): string {
        let line: string = "";
        
        if(reviewHistory.mostRecentTestTime) {
            line += reviewHistory.mostRecentTestTime.valueOf();
        }
        line += "\t";
    
        if(reviewHistory.currentTestDelay) {
            line += reviewHistory.currentTestDelay.toMillis();
        }
        line += "\t";

        if(reviewHistory.mostRecentTestRelationshipId) {
            line += reviewHistory.mostRecentTestRelationshipId;
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

    private indexByWordId(reviewHistories: WordReviewHistory[]): { [k:string]: WordReviewHistory} {
        let reviewHistoryByWordId: { [k:string]: WordReviewHistory} = {};

        for(let reviewHistory of reviewHistories) {
            reviewHistoryByWordId[reviewHistory.wordId] = reviewHistory;
        }

        return reviewHistoryByWordId;
    }
}