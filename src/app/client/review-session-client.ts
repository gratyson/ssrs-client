import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, map } from "rxjs";
import { ReviewEvent, ReviewType, WordReview } from "../review/model/review-session";
import { environment } from "../../environments/environment";
import { handleError } from "./client-util";
import { FutureReviewEvent, LexiconReviewHistory, LexiconReviewSummary, TestHistory } from "../lexicon/model/lexicon";
import { Duration } from "../util/duration/duration";
import { Word } from "../lexicon/model/word";
import { ReviewMode } from "../review/model/review-mode";

const SAVE_EVENT_ENDPOINT: string  = "review/saveEvent";
const GENERATE_LEARNING_SESSION_ENDPOINT: string  = "review/generateLearningSession";
const GENERATE_REVIEW_SESSION_ENDPOINT: string  = "review/generateReviewSession";
const GET_REVIEW_HISTORY_BATCH_ENDPOINT: string  = "review/lexiconReviewHistoryBatch";
const SAVE_REVIEW_HISTORY_BATCH_ENDPOINT: string  = "review/saveLexiconReviewHistoryBatch";
const DELETE_REVIEW_HISTORY_BATCH_ENDPOINT: string  = "review/deleteLexiconReviewHistoryBatch";
const ADJUST_NEXT_REVIEW_TIMES_ENDPOINT: string  = "review/adjustNextReviewTimes"
const GET_LEXICON_REVIEW_SUMMARY_ENDPOINT: string = "review/lexiconReviewSummary";

@Injectable({providedIn: "root"})
export class ReviewSessionClient {
 
    private readonly httpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public saveReviewEvent(event: ReviewEvent): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + SAVE_EVENT_ENDPOINT;

        return this.httpClient.post<void>(url, JSON.stringify(this.convertToServerReviewEvent(event)), this.httpOptions).pipe(catchError(handleError<void>("saveReviewEvent")));
    }

    public generateLearningSession(lexiconId: string, wordCnt: number): Observable<WordReview[][]> {
        const url: string = environment.REST_ENDPOINT_URL + GENERATE_LEARNING_SESSION_ENDPOINT;

        return this.httpClient.post<WordReviewFromServer[][]>(url, JSON.stringify({ lexiconId: lexiconId, wordCnt: wordCnt}), this.httpOptions)
            .pipe<WordReview[][]>(map(serverWordReviews => this.convertNestedServerWordReview(serverWordReviews)))
            .pipe(catchError(handleError<WordReview[][]>("generateLearningSession", [])));
    }

    public generateReviewSession(lexiconId: string, testRelationship: string = "", maxWordCnt: number = 0, cutoff: Date | null = null): Observable<WordReview[]> {
        const url: string = environment.REST_ENDPOINT_URL + GENERATE_REVIEW_SESSION_ENDPOINT;

        return this.httpClient.post<WordReviewFromServer[]>(url, JSON.stringify({ lexiconId: lexiconId, testRelationship: testRelationship, maxWordCnt: maxWordCnt, cutoff: cutoff ? cutoff.toISOString() : null }), this.httpOptions)
            .pipe<WordReview[]>(map(serverWordReviews => this.convertServerWordReview(serverWordReviews)))
            .pipe(catchError(handleError<WordReview[]>("generateReviewSession", [])));
    }
    
    public getLexiconReviewHistoryBatch(lexiconId: string, wordIds: string[]): Observable<LexiconReviewHistory[]> {
        const url: string = environment.REST_ENDPOINT_URL + GET_REVIEW_HISTORY_BATCH_ENDPOINT;

        return this.httpClient.post<LexiconReviewHistoryFromServer[]>(url, JSON.stringify({ lexiconId: lexiconId, wordIds: wordIds }), this.httpOptions)
            .pipe<LexiconReviewHistory[]>(map(serverReviewHistories => this.convertServerLexiconReviewHistory(serverReviewHistories)))
            .pipe(catchError(handleError<LexiconReviewHistory[]>("getLexiconHistoryBatch", [])));
    }

    public saveLexiconReviewHistoryBatch(lexiconId: string, reviewHistories: LexiconReviewHistory[]): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + SAVE_REVIEW_HISTORY_BATCH_ENDPOINT;

        return this.httpClient.post<void>(url, JSON.stringify(this.convertLexiconReviewHistory(reviewHistories)), this.httpOptions).pipe(catchError(handleError<void>("saveLexiconHistoryBatch")));
    }

    public deleteLexiconReviewHistory(lexiconId: string, wordId: string): Observable<void> {
        return this.deleteLexiconReviewHistoryBatch(lexiconId, [wordId]);
    }

    public deleteLexiconReviewHistoryBatch(lexiconId: string, wordIds: string[]): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + DELETE_REVIEW_HISTORY_BATCH_ENDPOINT;

        return this.httpClient.post<void>(url, JSON.stringify({ lexiconId: lexiconId, wordIds: wordIds }), this.httpOptions).pipe(catchError(handleError<void>("deleteLexiconReviewHistory")));
    }

    public adjustNextReviewTimes(lexiconId: string, adjustment: Duration) {
        const url: string = environment.REST_ENDPOINT_URL + ADJUST_NEXT_REVIEW_TIMES_ENDPOINT;

        return this.httpClient.post<void>(url, JSON.stringify({ lexiconId: lexiconId, adjustment: adjustment.toSeconds() }), this.httpOptions).pipe(catchError(handleError<void>("adjustNextReviewTimes")));
    }

    public getLexiconReviewSummary(lexiconId: string, cutoff: Date): Observable<LexiconReviewSummary> {
        const url: string = environment.REST_ENDPOINT_URL + GET_LEXICON_REVIEW_SUMMARY_ENDPOINT;

        let params = new URLSearchParams();
        params.append("lexiconId", lexiconId);
        params.append("futureEventCutoff", cutoff.toISOString());

        return this.httpClient.get<LexiconReviewSummaryFromServer>(`${url}?${params}`, this.httpOptions)
            .pipe(catchError(handleError<LexiconReviewSummaryFromServer>("getFutureReviewEvents")))
            .pipe(map<LexiconReviewSummaryFromServer, LexiconReviewSummary>(lexiconRevewSummaryFromServer => {
                let futureReviewEvents: FutureReviewEvent[] = [];
                
                if (lexiconRevewSummaryFromServer) {
                    for (let futureReviewEventFromServer of lexiconRevewSummaryFromServer.futureReviewEvents) {
                        futureReviewEvents.push({ 
                            lexiconId: futureReviewEventFromServer.lexiconId,
                            wordId: futureReviewEventFromServer.wordId,
                            reviewInstant: new Date(futureReviewEventFromServer.reviewInstant),
                            inferred: futureReviewEventFromServer.inferred
                        });
                    }
                }

                return { totalWords: lexiconRevewSummaryFromServer?.totalWords, learnedWords: lexiconRevewSummaryFromServer?.learnedWords, futureReviewEvents: futureReviewEvents };
            }));
    }

    private convertServerWordReview(serverWordReviews: WordReviewFromServer[]): WordReview[] {
        let wordReviews: WordReview[] = [];

        for(let serverWordReview of serverWordReviews) {
            wordReviews.push({
                languageId: serverWordReview.languageId,
                word: serverWordReview.word,
                scheduledEventId: serverWordReview.scheduledEventId,
                testOn: serverWordReview.testOn,
                promptWith: serverWordReview.promptWith,
                showAfterTest: serverWordReview.showAfterTest,

                reviewMode: ReviewMode.fromCode(serverWordReview.reviewMode),
                reviewType: serverWordReview.reviewType,
                recordResult: serverWordReview.recordResult,

                allowedTimeSec: serverWordReview.allowedTimeSec,

                typingTestButtons: serverWordReview.typingTestButtons,
                multipleChoiceButtons: serverWordReview.multipleChoiceButtons,
            });
        }

        return wordReviews;
    }

    private convertNestedServerWordReview(nestedServerWordReviews: WordReviewFromServer[][]): WordReview[][] {
        let nestedWordReviews: WordReview[][] = [];

        for(let nestedServerWordReview of nestedServerWordReviews) {
            nestedWordReviews.push(this.convertServerWordReview(nestedServerWordReview));
        }

        return nestedWordReviews;
    }

    private convertServerLexiconReviewHistory(serverReviewHistories: LexiconReviewHistoryFromServer[]): LexiconReviewHistory[] {
        let lexiconReviewHistories: LexiconReviewHistory[] = []
        
        for(let serverReviewHistory of serverReviewHistories) {
            lexiconReviewHistories.push({
                lexiconId: serverReviewHistory.lexiconId,
                wordId: serverReviewHistory.wordId,
                learned: serverReviewHistory.learned,
                mostRecentTestTime: new Date(serverReviewHistory.mostRecentTestTime),
                nextTestRelationId: serverReviewHistory.nextTestRelationId,
                currentTestDelay: Duration.fromSeconds(serverReviewHistory.currentTestDelay),
                nextTestTime: new Date(serverReviewHistory.nextTestTime),
                currentBoost: serverReviewHistory.currentBoost,
                currentBoostExpirationDelay: Duration.fromSeconds(serverReviewHistory.currentBoostExpirationDelay),
                testHistory: serverReviewHistory.testHistory,
            });
        }

        return lexiconReviewHistories;
    }

    private convertLexiconReviewHistory(lexiconReviewHistory: LexiconReviewHistory[]): LexiconReviewHistoryFromServer[] {
        let serverLexiconWordHistories: LexiconReviewHistoryFromServer[] = []
        
        for(let reviewHistory of lexiconReviewHistory) {
            serverLexiconWordHistories.push({
                lexiconId: reviewHistory.lexiconId,
                wordId: reviewHistory.wordId,
                learned: reviewHistory.learned,
                mostRecentTestTime: reviewHistory.mostRecentTestTime.toISOString(),
                nextTestRelationId: reviewHistory.nextTestRelationId,
                currentTestDelay: reviewHistory.currentTestDelay.toSeconds(),
                nextTestTime: reviewHistory.nextTestTime.toISOString(),
                currentBoost: reviewHistory.currentBoost,
                currentBoostExpirationDelay: reviewHistory.currentBoostExpirationDelay.toSeconds(),
                testHistory: reviewHistory.testHistory,
            });
        }

        return serverLexiconWordHistories;
    }

    private convertToServerReviewEvent(reviewEvent: ReviewEvent): ServerReviewEvent {
        return {
            scheduledEventId: reviewEvent.scheduledEventId,
            lexiconId: reviewEvent.lexiconId,
            wordId: reviewEvent.wordId,

            reviewMode: reviewEvent.reviewMode.getCode(),
            reviewType: reviewEvent.reviewType,
            testOn: reviewEvent.testOn,
            promptWith: reviewEvent.promptWith,

            isCorrect: reviewEvent.isCorrect,
            isNearMiss: reviewEvent.isNearMiss,
            elapsedTimeMs: reviewEvent.elapsedTimeMs,

            override: reviewEvent.override
        }
    }
}

interface WordReviewFromServer {
    languageId: number;
    word: Word;
    scheduledEventId: string;
    testOn: string;
    promptWith: string;
    showAfterTest: string;

    reviewMode: number;
    reviewType: ReviewType;
    recordResult: boolean;

    allowedTimeSec: number;

    typingTestButtons: string[];
    multipleChoiceButtons: string[];
}

interface LexiconReviewHistoryFromServer {
    lexiconId: string;
    wordId: string;
    learned: boolean;
    mostRecentTestTime: string;
    nextTestRelationId: string;
    currentTestDelay: number;
    nextTestTime: string;
    currentBoost: number;
    currentBoostExpirationDelay: number;
    testHistory: { [k:string]: TestHistory };
}

interface LexiconReviewSummaryFromServer {
    totalWords: number;
    learnedWords: number;
    futureReviewEvents: FutureReviewEventFromServer[];
}

interface FutureReviewEventFromServer {
    lexiconId: string,
    wordId: string,
    reviewInstant: string,
    inferred: boolean
}

interface ServerReviewEvent {
    scheduledEventId: string;
    lexiconId: string;
    wordId: string;

    reviewMode: number;
    reviewType: ReviewType;
    testOn: string;
    promptWith: string;

    isCorrect: boolean;
    isNearMiss: boolean;
    elapsedTimeMs: number;

    override: boolean;
}