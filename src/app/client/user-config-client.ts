import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError } from "rxjs";
import { environment } from "../../environments/environment";
import { handleError } from "./client-util";

const SET_CONFIG_ENDPOINT = "userConfig/setConfig";
const GET_CONFIG_ENDPOINT = "userConfig/getConfig";

@Injectable({providedIn: "root"})
export class UserConfigClient {
    private httpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public getUserConfig(): Observable<{ [k: string]: string }> {
        const url = environment.REST_ENDPOINT_URL + GET_CONFIG_ENDPOINT;

        return this.httpClient.get<{ [k: string]: string }>(url, this.httpOptions).pipe(catchError(handleError<{ [k: string]: string }>("getUserConfig", {})));
    }

    public saveUserConfig(userConfig: { [k: string]: string }): Observable<void> {
        const url = environment.REST_ENDPOINT_URL + SET_CONFIG_ENDPOINT;

        console.log("posting config");
        return this.httpClient.post<void>(url, JSON.stringify(userConfig), this.httpOptions).pipe(catchError(handleError<void>("saveUserConfig")));
    }
}