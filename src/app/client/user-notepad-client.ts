import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Observable, catchError, map } from "rxjs";
import { handleError } from "./client-util";

const GET_NOTEPAD_TEXT_ENDPOINT = "userNotepad/getNotepadText";
const SET_NOTEPAD_TEXT_ENDPOINT = "userNotepad/setNotepadText";

@Injectable({providedIn: "root"})
export class UserNotepadClient {

    constructor(private httpClient: HttpClient) {}

    public getUserNotepadText(): Observable<string> {
        const url: string = environment.REST_ENDPOINT_URL + GET_NOTEPAD_TEXT_ENDPOINT;
        const requestOptions: any = { headers: new HttpHeaders({ "Accept": "text/plain" }), responseType: "text" };

        // Angular client only supports resonseType: json with generics. Need to use get<any> with a piped map to string to return the correct observable
        return this.httpClient.get<any>(`${url}`, requestOptions).pipe(map<any, string>(resp => String(resp))).pipe(catchError(handleError<string>("getUserNotepadText", "")));
    }

    public saveUserNotepadText(text: string): Observable<void> {
        const url = environment.REST_ENDPOINT_URL + SET_NOTEPAD_TEXT_ENDPOINT;
        const requestOptions = { headers: new HttpHeaders({ "Content-Type": "application/json" }) };

        return this.httpClient.post<void>(url, JSON.stringify({ "notepadText": text }), requestOptions).pipe(catchError(handleError<void>("saveUserNotepadText")));
    }
}