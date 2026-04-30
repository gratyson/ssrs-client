import { Injectable, inject } from "@angular/core";
import { AuthClient } from "../client/auth-client";
import { Observable, finalize, map } from "rxjs";
import { AppHeaderService, LoadingBarPrecedence } from "../home/components/header/app-header-service";
import { Router } from "@angular/router";

@Injectable({providedIn: "root"})
export class UserService {

    private router: Router = inject(Router);
    private authClient: AuthClient = inject(AuthClient);
    private appHeaderService: AppHeaderService = inject(AppHeaderService);

    public username: string = "";

    public refreshLoggedIn(): Observable<boolean> {
        this.appHeaderService.showLoadingBar(this, LoadingBarPrecedence.Medium, 500);
        return this.authClient.getLoggedInUsername().pipe(finalize(() => this.appHeaderService.clearLoadingBar(this))).pipe(map(username => {
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

    public verifyLoggedIn(): Observable<boolean> {
        return this.refreshLoggedIn().pipe(map(isLoggedIn => {
            if (!isLoggedIn) {
                this.router.navigate([ 'app/login' ]);
            }

            return isLoggedIn;
        }));
    }
}