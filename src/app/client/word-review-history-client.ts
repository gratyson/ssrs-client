import { Injectable } from "@angular/core";
import { catchError, map, Observable } from "rxjs";
import { TestHistory, WordReviewHistory } from "../lexicon/model/lexicon";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { handleError } from "./client-util";
import { Duration } from "../util/duration/duration";

const GET_WORD_REVIEW_HISTORY_BATCH_ENDPOINT: string = "history/getWordReviewHistoryBatch";
const SAVE_WORD_REVIEW_HISTORY_BATCH_ENDPOINT: string = "history/saveWordReviewHistoryBatch";
const RESET_LEARNING_HISTORY_ENDPOINT: string = "history/resetLearningHistory";


@Injectable({providedIn: "root"})
export class WordReviewHistoryClient {
        
    httpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public getWordReviewHistoryBatch(lexiconId: string, wordIds: string[]): Observable<WordReviewHistory[]> {
        const url: string = environment.REST_ENDPOINT_URL + GET_WORD_REVIEW_HISTORY_BATCH_ENDPOINT;

        return this.httpClient.post<LexiconReviewHistoryFromServer[]>(url, JSON.stringify({ lexiconId: lexiconId, wordIds: wordIds }), this.httpOptions)
            .pipe<WordReviewHistory[]>(map(serverReviewHistories => this.convertServerLexiconReviewHistory(serverReviewHistories)))
            .pipe(catchError(handleError<WordReviewHistory[]>("getLexiconHistoryBatch", [])));
    }

    public saveWordReviewHistoryBatch(lexiconId: string, reviewHistories: WordReviewHistory[]): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + SAVE_WORD_REVIEW_HISTORY_BATCH_ENDPOINT;

        return this.httpClient.post<void>(url, JSON.stringify(this.convertLexiconReviewHistory(reviewHistories)), this.httpOptions).pipe(catchError(handleError<void>("saveLexiconHistoryBatch")));
    }

    public resetLearningHistory(lexiconId: string, wordId: string): Observable<void> {
        return this.resetLearningHistoryBatch(lexiconId, [wordId]);
    }

    public resetLearningHistoryBatch(lexiconId: string, wordIds: string[]): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + RESET_LEARNING_HISTORY_ENDPOINT;

        return this.httpClient.post<void>(url, JSON.stringify({ lexiconId: lexiconId, wordIds: wordIds }), this.httpOptions).pipe(catchError(handleError<void>("deleteLexiconReviewHistory")));
    }

    private convertServerLexiconReviewHistory(serverReviewHistories: LexiconReviewHistoryFromServer[]): WordReviewHistory[] {
        let lexiconReviewHistories: WordReviewHistory[] = []
        
        for(let serverReviewHistory of serverReviewHistories) {
            lexiconReviewHistories.push({
                lexiconId: serverReviewHistory.lexiconId,
                wordId: serverReviewHistory.wordId,
                learned: serverReviewHistory.learned,
                mostRecentTestTime: new Date(serverReviewHistory.mostRecentTestTime),
                mostRecentTestRelationshipId: serverReviewHistory.mostRecentTestRelationshipId,
                currentTestDelay: Duration.fromSeconds(serverReviewHistory.currentTestDelay),
                currentBoost: serverReviewHistory.currentBoost,
                currentBoostExpirationDelay: Duration.fromSeconds(serverReviewHistory.currentBoostExpirationDelay),
                testHistory: serverReviewHistory.testHistory,
            });
        }

        return lexiconReviewHistories;
    }

    private convertLexiconReviewHistory(lexiconReviewHistory: WordReviewHistory[]): LexiconReviewHistoryFromServer[] {
        let serverLexiconWordHistories: LexiconReviewHistoryFromServer[] = []
        
        for(let reviewHistory of lexiconReviewHistory) {
            serverLexiconWordHistories.push({
                lexiconId: reviewHistory.lexiconId,
                wordId: reviewHistory.wordId,
                learned: reviewHistory.learned,
                mostRecentTestTime: reviewHistory.mostRecentTestTime.toISOString(),
                mostRecentTestRelationshipId: reviewHistory.mostRecentTestRelationshipId,
                currentTestDelay: reviewHistory.currentTestDelay.toSeconds(),
                currentBoost: reviewHistory.currentBoost,
                currentBoostExpirationDelay: reviewHistory.currentBoostExpirationDelay.toSeconds(),
                testHistory: reviewHistory.testHistory,
            });
        }

        return serverLexiconWordHistories;
    }
} 

interface LexiconReviewHistoryFromServer {
    lexiconId: string;
    wordId: string;
    learned: boolean;
    mostRecentTestTime: string;
    mostRecentTestRelationshipId: string;
    currentTestDelay: number;
    currentBoost: number;
    currentBoostExpirationDelay: number;
    testHistory: { [k:string]: TestHistory };
}