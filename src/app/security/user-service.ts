import { Injectable, inject } from "@angular/core";
import { AuthClient } from "../client/auth-client";
import { Observable, map, of } from "rxjs";

@Injectable({providedIn: "root"})
export class UserService {

    private authClient: AuthClient = inject(AuthClient);

    public username: string = "";

    public refreshLoggedIn(): Observable<boolean> {
        return this.authClient.getLoggedInUsername().pipe(map(username => {
            if (username) {
                this.username = username;
                return this.isLoggedIn();
            }
            return false;
        }))
    }

    public isLoggedIn(): boolean {
        return !!this.username;
    }
}