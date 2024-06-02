import { Injectable, inject } from "@angular/core";
import { Language, WordElement } from "../../language/language";
import { Word } from "../model/word"
import { WordClient } from "../../client/word-client";
import { Observable, firstValueFrom, forkJoin, from, map, merge, mergeMap, mergeWith, of, switchMap } from "rxjs";
import { EMPTY_LEXICON_REVIEW_HISTORY, LexiconReviewHistory, TestHistory } from "../model/lexicon";
import { Duration } from "../../util/duration/duration";
import { ReviewSessionClient } from "../../client/review-session-client";
import { environment } from "../../../environments/environment";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialog } from "../../util/confirm-dialog";

const SAVE_BATCH_SIZE: number = 250;
const HASH_ROOT: number = 44340143;
const HASH_SEED: number = 226272509;

@Injectable({ providedIn: "root" })
export class WordParser {

    private wordClient: WordClient = inject(WordClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);

    constructor(private dialog: MatDialog) { }

    public parseFile(language: Language, lexiconId: string, file: File): Observable<WordParseResult> {
        return from(file.text()).pipe(switchMap((fileText) => {
            const allLines = fileText.split(/\r\n|\n/);

            if (allLines.length >= environment.LOAD_WORDS_FROM_FILE_WARN_SIZE) {
                const dialogRef = this.dialog.open(ConfirmDialog, {
                    data: {
                        title: "Import Words?",
                        message: `Attempting to import ${allLines.length} words. Continue?`,
                        confirmAction: "Continue",
                        cancelAction: "Cancel",
                    },
                });

                return dialogRef.afterClosed().pipe(switchMap((result) => {
                    if (result) {
                        return this.parseLines(language, lexiconId, allLines);
                    } else {
                        return of(new WordParseResult());
                    }
                }));
            }

            return this.parseLines(language, lexiconId, allLines);
        }));
    }

    private parseLines(language: Language, lexiconId: string, lines: string[]): Observable<WordParseResult> {
        let wordParseResult: WordParseResult = new WordParseResult();
        let wordsToSave: Word[] = [];
        let reviewHistoryByWordElementStr: { [k:string]: LexiconReviewHistory } = {};

        for(const line of lines) {
            if (line !== "") { 
                const linePieces = line.split("\t");
                const word: Word | null = this.parseWordFromLine(language,  linePieces);
                if (word === null) {
                    console.log(`Line ${line} failed validation and was skipped.`);
                    wordParseResult.failedValidation++;
                } else {
                    wordsToSave.push(word);
                    
                    const reviewHistory = this.parseHistoryFromLine(language, lexiconId, word.id, linePieces);
                    if (reviewHistory !== null) {
                        reviewHistoryByWordElementStr[this.wordElementsToString(language, word)] = reviewHistory;
                    } 
                }
            }
        }

        return from(this.saveWords(lexiconId, wordsToSave)).pipe(map((savedWords) => {
            wordParseResult.words = savedWords;

            wordParseResult.skipped = wordsToSave.length - wordParseResult.words.length;

            if (Object.keys(reviewHistoryByWordElementStr).length > 0) {
                wordParseResult.reviewHistoryById = this.saveReviewHistory(language, lexiconId, wordParseResult.words, reviewHistoryByWordElementStr);
            } else {
                wordParseResult.reviewHistoryById = {};
            }

            return wordParseResult;
        }));
    }

    private parseWordFromLine(language: Language, linePieces: string[]): Word | null {
        let elements: {[k:string]: string} = {};
        let pos: number = 0;

        for(let element of language.validElements) {
            let elementValue: string = linePieces[pos++].trim();

            if (language.requiredElements.includes(element) && !elementValue) {
                return null;  // missing required value
            }

            elements[element.id] = elementValue;
        }

        const attributes = linePieces[pos++];
        if (!attributes) {
            return null;  // attributes are required
        }

        return { id: "", elements: elements, attributes: attributes, audioFiles: [] };
    }

    private parseHistoryFromLine(language: Language, lexiconId: string, wordId: string, linePieces: string[]): LexiconReviewHistory | null {
        let pos: number = language.validElements.length + 1;  // preceding portion of line is all elements + 1 attributes piece

        if (linePieces.length < pos + 6) {   
            return null;
        }
        
        const mostRecentTimeMillis: number = Number.parseInt(linePieces[pos++]);
        const currentTestDelayMillis: number = Number.parseInt(linePieces[pos++]);
        const nextTestRelationId: string = linePieces[pos++];
        const nextTestTimeMillis: number = Number.parseInt(linePieces[pos++]);

        // required elements
        if (!mostRecentTimeMillis || !currentTestDelayMillis || !nextTestRelationId || !nextTestTimeMillis) {
            return null;
        }

        const currentBoost: number = Number.parseFloat(linePieces[pos++]);
        const currentBoostExpirationDelayMillis: number = Number.parseInt(linePieces[pos++]);
        let testHistoryMap: { [k:string]: TestHistory } = {};

        while(pos < linePieces.length) {
            const testHistoryPieces = linePieces[pos++].split(",");
            
            testHistoryMap[testHistoryPieces[0]] = { 
                totalTests: Number.parseInt(testHistoryPieces[1]), 
                correct: Number.parseInt(testHistoryPieces[2]), 
                correctStreak: Number.parseInt(testHistoryPieces[3]) 
            };
        }

        return { 
            lexiconId: lexiconId, 
            wordId: wordId,
            learned: true,
            mostRecentTestTime: new Date(mostRecentTimeMillis),
            currentTestDelay: Duration.fromMillis(currentTestDelayMillis),
            nextTestRelationId: nextTestRelationId,
            nextTestTime: new Date(nextTestTimeMillis),
            currentBoost: currentBoost,
            currentBoostExpirationDelay: Duration.fromMillis(currentBoostExpirationDelayMillis),
            testHistory: testHistoryMap,

        }
    }

    private async saveWords(lexiconId: string, words: Word[]): Promise<Word[]> {
        let saveWordsObservables: Observable<Word[]>[] = [];
        for(let i = 0; i < words.length; i += SAVE_BATCH_SIZE) {
            saveWordsObservables.push(this.wordClient.saveWords(words.slice(i, i + SAVE_BATCH_SIZE), lexiconId));
        }

        let savedWords: Word[] = [];
        for(let saveWordsObservable of saveWordsObservables) {
            savedWords = savedWords.concat(await firstValueFrom(saveWordsObservable));
        }

        return savedWords;
    }

    private saveReviewHistory(language: Language, lexiconId: string, savedWords: Word[], reviewHistoryByWordElements: { [k: string]: LexiconReviewHistory }): { [k: string]: LexiconReviewHistory } {
        let reviewHistoryByWordId: { [k:string ]: LexiconReviewHistory } = {};

        let reviewHistoryToSave: LexiconReviewHistory[] = [];
        for (let word of savedWords) {
            const reviewHistoryWithoutWordId: LexiconReviewHistory | undefined = reviewHistoryByWordElements[this.wordElementsToString(language, word)];
            if (reviewHistoryWithoutWordId) {
                const reviewHistory = this.withWordId(reviewHistoryWithoutWordId, word.id);

                reviewHistoryByWordId[word.id] = reviewHistory;
                reviewHistoryToSave.push(reviewHistory);

                if (reviewHistoryToSave.length >= SAVE_BATCH_SIZE) {
                    this.reviewSessionClient.saveLexiconReviewHistoryBatch(lexiconId, reviewHistoryToSave).subscribe();
                    reviewHistoryToSave = [];
                }
            }
        }

        if (reviewHistoryToSave.length > 0) {
            this.reviewSessionClient.saveLexiconReviewHistoryBatch(lexiconId, reviewHistoryToSave).subscribe();
        }

        return reviewHistoryByWordId;
    }

    private withWordId(lexiconReviewHistory: LexiconReviewHistory, wordId: string): LexiconReviewHistory {
        return {
            lexiconId: lexiconReviewHistory.lexiconId,
            wordId: wordId,
            learned: lexiconReviewHistory.learned,
            mostRecentTestTime: lexiconReviewHistory.mostRecentTestTime,
            nextTestRelationId: lexiconReviewHistory.nextTestRelationId,
            currentTestDelay: lexiconReviewHistory.currentTestDelay,
            nextTestTime: lexiconReviewHistory.nextTestTime,
            currentBoost: lexiconReviewHistory.currentBoost,
            currentBoostExpirationDelay: lexiconReviewHistory.currentBoostExpirationDelay,
            testHistory: lexiconReviewHistory.testHistory
        }
    }

    private wordElementsToString(language: Language, word: Word) {
        let wordStr: string = "";
        
        for(let languageElement of language.dedupeElements) {
            if (word.elements[languageElement.id]) {
                wordStr += `[${languageElement.name}=${word.elements[languageElement.id]}]`;
            }
        }

        return wordStr;
    }
}

export class WordParseResult {
    words: Word[] = [];
    reviewHistoryById: { [k:string]: LexiconReviewHistory }
    failedValidation: number = 0;
    skipped: number = 0;
}

