import { Injectable } from "@angular/core";
import { Observable, catchError } from "rxjs";
import { environment } from "../../environments/environment";
import { Language, WordElement } from "../language/language";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { handleError } from "./client-util";

const WORD_ELEMENTS_URL = "language/allElements";
const LANGUAGES_URL = "language/allLanguages";

@Injectable({providedIn: "root"})
export class LanguageClient {
    
    private httpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public loadAllLanguages(): Observable<Language[]> {
        const url = environment.REST_ENDPOINT_URL + LANGUAGES_URL;

        return this.httpClient.get<Language[]>(url, this.httpOptions).pipe(catchError(handleError("loadAllLanguages", [])));
    }

    public loadAllWordElements(): Observable<WordElement[]> {
        const url = environment.REST_ENDPOINT_URL + WORD_ELEMENTS_URL;

        return this.httpClient.get<WordElement[]>(url, this.httpOptions).pipe(catchError(handleError("loadAllWordElements", [])));
    }
}