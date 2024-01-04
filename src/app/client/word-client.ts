import { Word } from "../lexicon/model/word";
import { environment } from "../../environments/environment";
import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from "rxjs";
import { catchError, map, tap } from 'rxjs/operators';
import { handleError } from "./client-util";

const WORD_ENDPOINT: string = "lexicon/word";
const UPDATE_WORD_ENDPOINT: string = "lexicon/updateWord";
const SAVE_WORD_ENDPOINT: string = "lexicon/saveWords";
const DELETE_WORDS_ENDPOINT: string = "lexicon/deleteWords";
const LOAD_WORDS_BATCH_ENDPOINT = "lexicon/lexiconWords";

@Injectable({providedIn: "root"})
export class WordClient {

    httpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public loadWord(id: string): Observable<Word> {
        let params = new URLSearchParams();
        params.append("id", id);

        const url: string = environment.REST_ENDPOINT_URL + WORD_ENDPOINT;
        
        return this.httpClient.get<Word>(`${url}?${params}`, this.httpOptions).pipe(catchError(handleError("LoadWord", {} as Word)));
    }

    public updateWord(word: Word): Observable<Word> {
        const url: string = environment.REST_ENDPOINT_URL + UPDATE_WORD_ENDPOINT;

        return this.httpClient.post<Word>(`${url}`, JSON.stringify(word), this.httpOptions).pipe(catchError(handleError<Word>("UpdateWord")));
    }

    public saveWord(word: Word, lexiconId: string =""): Observable<Word | null> {
        return this.saveWords([word], lexiconId).pipe(map(words => {
                if (words.length > 0) {
                    return words[0];
                }
                return null;
            }));
    }

    public saveWords(word: Word[], lexiconId: string): Observable<Word[]> {
        const url: string = environment.REST_ENDPOINT_URL + SAVE_WORD_ENDPOINT;

        return this.httpClient.put<Word[]>(`${url}`, JSON.stringify({ words: word, lexiconId: lexiconId}), this.httpOptions).pipe(catchError(handleError<Word[]>("SaveWords", [])));
    }

    public deleteWord(lexiconId: string, wordId: string): Observable<void> {
        return this.deleteWords(lexiconId, [wordId]);
    }

    public deleteWords(lexiconId: string, wordIds: string[]): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + DELETE_WORDS_ENDPOINT;

        return this.httpClient.post<void>(`${url}`, JSON.stringify({ lexiconId: lexiconId, wordIds: wordIds }), this.httpOptions).pipe(catchError(handleError<void>("deleteWords")));
    }

    public loadWordsBatch(lexiconId: string, count: number, offset: number, wordFilterOptions: WordFilterOptions = EMPTY_WORD_FILTER_OPTIONS): Observable<Word[]> {
        const url: string = environment.REST_ENDPOINT_URL + LOAD_WORDS_BATCH_ENDPOINT;

        return this.httpClient.post<Word[]>(`${url}`, JSON.stringify({ "lexiconId": lexiconId, "count": count, "offset": offset, "filters": wordFilterOptions }), this.httpOptions).pipe(catchError(handleError<Word[]>("loadWordsBatch", [])));
    }


}

export interface WordFilterOptions {
    elements: {[k:string]: string};
    attributes: string;
    learned: boolean | null;
    hasAudio: boolean | null;
}

export const EMPTY_WORD_FILTER_OPTIONS: WordFilterOptions = { elements: {}, attributes: "", learned: null, hasAudio: null };

