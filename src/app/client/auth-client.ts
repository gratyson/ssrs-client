import { HttpClient, HttpHeaders } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable, catchError, map, of, retry } from "rxjs";
import { Injectable } from "@angular/core";
import { handleError } from "./client-util";

const USERNAME_ENDPOINT: string = "auth/username";
const LOGIN_ENDPOINT: string = "auth/login";  
const LOGOUT_ENDPOINT: string = "auth/logout";
const CAN_REGISTER_ENDPOINT: string = "auth/canRegister";
const REGISTER_ENDPOINT: string = "auth/register";

@Injectable({providedIn: "root"})
export class AuthClient {
    httpOptions = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "application/json" }) };

    constructor(private httpClient: HttpClient) {}

    public getLoggedInUsername(): Observable<string> {
        
        const url: string = environment.REST_ENDPOINT_URL + USERNAME_ENDPOINT;
        const requestOptions: any = { headers: new HttpHeaders({ "Content-Type": "application/json", "Accept": "text/plain" }), responseType: "text" };

        // Angular client only supports resonseType: json with generics. Need to use get<any> with a piped map to string to return the correct observable
        return this.httpClient.get<any>(`${url}`, requestOptions).pipe(map<any, string>(resp => String(resp))).pipe(catchError(handleError<string>("getLoggedInUsername", "")));
    }

    public login(username: string, password: string): Observable<LoginResponse> {
        const url: string = environment.REST_ENDPOINT_URL + LOGIN_ENDPOINT; 

        // This should always be the first POST request sent to the server so the very first call will fail due to XRSF (and will subsequently set the required token). Include a retry on error so that it will retry with the new XSRF value
        return this.httpClient.post<LoginResponse>(url, JSON.stringify({ "username": username, "password": password }), this.httpOptions).pipe(retry(1), catchError(handleError<LoginResponse>("login", { success: false, errMsg: "Error occurred during login"})));
    }

    public logout(): Observable<void> {
        const url: string = environment.REST_ENDPOINT_URL + LOGOUT_ENDPOINT; 

        return this.httpClient.post<void>(url, this.httpOptions).pipe(catchError(handleError<void>("logout")));
    }

    public canRegister(): Observable<boolean> {
        const url: string = environment.REST_ENDPOINT_URL + CAN_REGISTER_ENDPOINT;

        return this.httpClient.get<boolean>(url, this.httpOptions).pipe(catchError(handleError<boolean>("canRegister", false)));
    }
    
    public register(username: string, password: string, reenterPassword: string): Observable<RegisterResponse> {
        const url: string = environment.REST_ENDPOINT_URL + REGISTER_ENDPOINT;

        return this.httpClient.post<RegisterResponse>(url, JSON.stringify({ "username": username, "password": password, "reenterPassword": reenterPassword}), this.httpOptions).pipe(catchError(handleError<RegisterResponse>("register", { success: false, errMsg: "Error occurred during registration" })));
    }
}

function handleGetLoggedInUsernameError() {
    return (error: any): Observable<string | null> => {
        if (error.status === 403) {
            // permission denied            
            return of("");
        } else {
            // generic error handling
            console.log(`getLoggedInUsername failed: ${error.message}`);
            console.error(error); // log to console instead        

            return of(null);
        }
        
    }
}


export interface LoginResponse {
    success: boolean,
    errMsg: string
}

export interface RegisterResponse {
    success: boolean,
    errMsg: string
}