import { Injectable, inject } from "@angular/core";
import { Language } from "../../language/language";
import { Word } from "../model/word"
import { WordClient } from "../../client/word-client";
import { Observable, firstValueFrom, from, map, of, switchMap } from "rxjs";
import { WordReviewHistory, TestHistory } from "../model/lexicon";
import { Duration } from "../../util/duration/duration";
import { environment } from "../../../environments/environment";
import { MatDialog } from "@angular/material/dialog";
import { ConfirmDialog } from "../../util/confirm-dialog";
import { WordReviewHistoryClient } from "../../client/word-review-history-client";

const SAVE_BATCH_SIZE: number = 250;

@Injectable({ providedIn: "root" })
export class WordParser {

    private wordClient: WordClient = inject(WordClient);
    private wordReviewHistoryClient: WordReviewHistoryClient = inject(WordReviewHistoryClient);

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
        let reviewHistoryByWordElementStr: { [k:string]: WordReviewHistory } = {};
        const validationRegExpDict: { [k:string]: RegExp } = this.getValidationRegExpForLanguage(language);

        for(const line of lines) {
            if (line !== "") { 
                const linePieces = line.split("\t");
                const word: Word | null = this.parseWordFromLine(language, lexiconId, linePieces, validationRegExpDict);
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

        return this.saveWordBatches(language, lexiconId, wordsToSave, reviewHistoryByWordElementStr).pipe(map(saveWordResult => {
            wordParseResult.words = saveWordResult.savedWords;
            wordParseResult.reviewHistoryById = saveWordResult.wordReviewHistoryByWordId;
            wordParseResult.skipped = wordsToSave.length - saveWordResult.savedWords.length;

            return wordParseResult;
        }));
    }

    private parseWordFromLine(language: Language, lexiconId: string, linePieces: string[], validationRegExpDict: { [k:string]: RegExp }): Word | null {
        let elements: {[k:string]: string} = {};
        let pos: number = 0;

        for(let element of language.validElements) {
            let elementValue: string = linePieces[pos++].trim();

            if (language.requiredElements.includes(element) && !elementValue) {
                return null;  // missing required value
            }

            if (elementValue && validationRegExpDict[element.id] && !validationRegExpDict[element.id].test(elementValue)) {
                return null;  // failed validation
            }

            elements[element.id] = elementValue;
        }

        const attributes = linePieces[pos++];
        if (!attributes) {
            return null;  // attributes are required
        }

        return { id: "", lexiconId: lexiconId, elements: elements, attributes: attributes, audioFiles: [], createInstant: null, updateInstant: null };
    }

    private parseHistoryFromLine(language: Language, lexiconId: string, wordId: string, linePieces: string[]): WordReviewHistory | null {
        let pos: number = language.validElements.length + 1;  // preceding portion of line is all elements + 1 attributes piece

        if (linePieces.length < pos + 6) {   
            return null;
        }
        
        const mostRecentTimeMillis: number = Number.parseInt(linePieces[pos++]);
        const currentTestDelayMillis: number = Number.parseInt(linePieces[pos++]);
        const mostRecentTestRelationshipId: string = linePieces[pos++];

        // required elements
        if (!mostRecentTimeMillis || !currentTestDelayMillis) {
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
            mostRecentTestRelationshipId: mostRecentTestRelationshipId,
            currentBoost: currentBoost,
            currentBoostExpirationDelay: Duration.fromMillis(currentBoostExpirationDelayMillis),
            testHistory: testHistoryMap,

        }
    }

    private saveWordBatches(language: Language, lexiconId: string, words: Word[], reviewHistoryByWordElements: { [k: string]: WordReviewHistory }): Observable<SaveWordResult> {
        let wordBatches: Word[][] = this.generateWordBatches(words);

        return this.saveWordBatchesRecurse(language, lexiconId, wordBatches, reviewHistoryByWordElements, 0);
    }

    private generateWordBatches(words: Word[]): Word[][] {
        let wordBatches: Word[][] = [];

        for(let i = 0; i < words.length; i += SAVE_BATCH_SIZE) {
            wordBatches.push(words.slice(i, i + SAVE_BATCH_SIZE));
        }

        return wordBatches;
    }

    private saveWordBatchesRecurse(language: Language, lexiconId: string, wordBatchs: Word[][], reviewHistoryByWordElements: { [k: string]: WordReviewHistory }, currentBatch: number): Observable<SaveWordResult> {
        if (currentBatch >= wordBatchs.length) {
            return of({ savedWords: [], wordReviewHistoryByWordId: {} });
        } else {
            return this.saveWordBatchesRecurse(language, lexiconId, wordBatchs, reviewHistoryByWordElements, currentBatch + 1).pipe(switchMap(saveWordResults => {
                return this.wordClient.saveWords(wordBatchs[currentBatch], lexiconId).pipe(switchMap(savedWords => {
                    return this.saveReviewHistoryBatch(language, lexiconId, savedWords, reviewHistoryByWordElements).pipe(switchMap(reviewHistoryByWordIdBatch => {
                        return of({
                            savedWords: saveWordResults.savedWords.concat(savedWords),
                            wordReviewHistoryByWordId: { ...saveWordResults.wordReviewHistoryByWordId, ...reviewHistoryByWordIdBatch }
                        });
                    }))
                }))
            }))
        }
    }

    private saveReviewHistoryBatch(language: Language, lexiconId: string, savedWords: Word[], reviewHistoryByWordElements: { [k: string]: WordReviewHistory }): Observable<{ [k: string]: WordReviewHistory }> {
        let reviewHistoryByWordId: { [k:string ]: WordReviewHistory } = {};

        let reviewHistoryToSave: WordReviewHistory[] = [];
        for (let word of savedWords) {
            const reviewHistoryWithoutWordId: WordReviewHistory | undefined = reviewHistoryByWordElements[this.wordElementsToString(language, word)];
            if (reviewHistoryWithoutWordId) {
                const reviewHistory = this.withWordId(reviewHistoryWithoutWordId, word.id);

                reviewHistoryByWordId[word.id] = reviewHistory;
                reviewHistoryToSave.push(reviewHistory);
            }
        }

        if (reviewHistoryToSave.length > 0) {
            return this.wordReviewHistoryClient.saveWordReviewHistoryBatch(lexiconId, reviewHistoryToSave).pipe(map(() => reviewHistoryByWordId));
        }

        return of({});
    }

    private withWordId(lexiconReviewHistory: WordReviewHistory, wordId: string): WordReviewHistory {
        return {
            lexiconId: lexiconReviewHistory.lexiconId,
            wordId: wordId,
            learned: lexiconReviewHistory.learned,
            mostRecentTestTime: lexiconReviewHistory.mostRecentTestTime,
            mostRecentTestRelationshipId: lexiconReviewHistory.mostRecentTestRelationshipId,
            currentTestDelay: lexiconReviewHistory.currentTestDelay,
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

    private getValidationRegExpForLanguage(language: Language): { [k:string]: RegExp } {
        let regExpDict: { [k:string]: RegExp } = {};

        for (let element of language.validElements) {
            if (element.validationRegex) {
                regExpDict[element.id] = new RegExp(element.validationRegex);
            }
        }

        return regExpDict;
    }
}

export class WordParseResult {
    words: Word[] = [];
    reviewHistoryById: { [k:string]: WordReviewHistory }
    failedValidation: number = 0;
    skipped: number = 0;
}

interface SaveWordResult {
    savedWords: Word[];
    wordReviewHistoryByWordId: { [k: string]: WordReviewHistory };
}