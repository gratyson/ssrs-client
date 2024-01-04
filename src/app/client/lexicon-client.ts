import { Injectable } from "@angular/core";
import { Lexicon, LexiconMetadata, LexiconMetadataAndScheduledCounts, LexiconReviewHistory, TestHistory } from "../lexicon/model/lexicon";
import { environment } from "../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, catchError, map, of } from "rxjs";
import { handleError } from "./client-util";

const GET_LEXICON_ENDPOINT: string = "lexicon/lexicon";
const GET_ALL_LEXICON_METADATA_ENDPOINT = "lexicon/allLexiconMetadata";
const GET_LEXICON_METADATA_ENDPOINT: string = "lexicon/lexiconMetadata";
const GET_LEXICON_METADATA_AND_SCHEDULED_COUNTS_ENDPOINT: string = "lexicon/allLexiconMetadataAndScheduledCounts";
const SAVE_LEXICON_METADATA_ENDPOINT: string = "lexicon/saveLexiconMetadata";
const DELETE_LEXICON_ENDPOINT: string = "lexicon/deleteLexicon";

const IMAGE_BLOB_PATH_PREFIX: string =  "blob/image/";
const DEFAULT_IMAGE_PATH: string = "/assets/images/DefaultDictImage.png";

const EMPTY_FILE: File = new File([""], "empty");

@Injectable({providedIn: "root"})
export class LexiconClient {

    jsonContentHttpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };
    formContentHttpOptions = { headers: new HttpHeaders({ "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public getImagePath(lexicon: LexiconMetadata): string {
        if (lexicon && lexicon.imageFileName) {
            return environment.REST_ENDPOINT_URL + IMAGE_BLOB_PATH_PREFIX + lexicon.imageFileName;
        }
        
        console.log("No lexicon image file set. Returning default image file.")
        return DEFAULT_IMAGE_PATH;
    }

    public loadLexicon(id: string): Observable<Lexicon> {
        return this.loadLexiconData(id, GET_LEXICON_ENDPOINT);
    }

    public loadAllLexiconMetadata(): Observable<LexiconMetadata[]> {
        const url: string = environment.REST_ENDPOINT_URL + GET_ALL_LEXICON_METADATA_ENDPOINT;

        return this.httpClient.get<LexiconMetadata[]>(url, this.jsonContentHttpOptions).pipe(catchError(handleError<LexiconMetadata[]>("loadAllLexiconMetadata", [])));
    }

    public loadAllLexiconMetadataAndScheduledCounts(cutoff: Date | null = null): Observable<LexiconMetadataAndScheduledCounts[]> {
        let url: string = environment.REST_ENDPOINT_URL + GET_LEXICON_METADATA_AND_SCHEDULED_COUNTS_ENDPOINT;

        
        if (cutoff) {
            let params = new URLSearchParams();
            params.append("cutoff", cutoff.toISOString());

            url = `${url}?${params}`;
        }

        return this.httpClient.get<LexiconMetadataAndScheduledCounts[]>(url, this.jsonContentHttpOptions).pipe(catchError(handleError<LexiconMetadataAndScheduledCounts[]>("loadAllLexiconMetadataAndScheduledCounts", [])));
    }

    public loadLexiconMetadata(id: string): Observable<LexiconMetadata> {
        return this.loadLexiconData(id, GET_LEXICON_METADATA_ENDPOINT);
    }

    public loadLexiconData(id: string, endpoint: string): Observable<Lexicon> {
        if (!id || id ==="") {
            return of(Lexicon.getBlankLexicon());
        }

        let params = new URLSearchParams();
        params.append("id", id);

        const url: string = environment.REST_ENDPOINT_URL + endpoint;

        return this.httpClient.get<Lexicon>(`${url}?${params}`, this.jsonContentHttpOptions).pipe(catchError(handleError<Lexicon>("loadLexiconData", Lexicon.getBlankLexicon())));
    }

    public saveLexiconMetadata(lexiconMetadata: LexiconMetadata, imageFile: File): Observable<Lexicon> {
        let headers = new Headers();
        headers.append("Accept", "application/json");

        const url: string = environment.REST_ENDPOINT_URL + SAVE_LEXICON_METADATA_ENDPOINT;

        let formData: FormData = new FormData();
        formData.append("file", imageFile ? imageFile : EMPTY_FILE);
        formData.append("lexicon", new Blob([JSON.stringify(lexiconMetadata)], { type: "application/json" }));

        return this.httpClient.put<Lexicon>(url, formData, this.formContentHttpOptions).pipe(catchError(handleError<Lexicon>("saveLexiconMetadata")));
    }

    public deleteLexicon(lexiconId: string): Observable<boolean> {
        const url: string = environment.REST_ENDPOINT_URL + DELETE_LEXICON_ENDPOINT;

        return this.httpClient.post<boolean>(url, lexiconId, this.jsonContentHttpOptions).pipe(catchError(handleError<boolean>("deleteLexicon", false)));
    }
}

    