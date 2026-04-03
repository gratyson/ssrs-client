import { Component, inject } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AuthClient } from "../../../client/auth-client";
import { UserService } from "../../../security/user-service";
import { Router, RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AppHeaderService, LoadingBarPrecedence, LoadingBarStatus } from "./app-header-service";

const LOADING_BAR_CLASS_MAP: { [k: number]: string } = {
    [LoadingBarPrecedence.High]: "progress-bar-warn-200",
    [LoadingBarPrecedence.Medium]: "progress-bar-accent-200",
    [LoadingBarPrecedence.Low]: "progress-bar-primary-200",
};

@Component({
    selector: "app-header",
    templateUrl: "app-header.html",
    styleUrl: "app-header.css",
    imports: [MatFormFieldModule, MatIconModule, MatButtonModule, MatMenuModule, MatProgressBarModule, RouterLink]
})
export class AppHeaderComponent {

    userService: UserService = inject(UserService);
    authClient: AuthClient = inject(AuthClient);
    router: Router = inject(Router);
    appHeaderService: AppHeaderService = inject(AppHeaderService);

    displayProgessBar: string = "hidden";
    progressBarClass: string = LOADING_BAR_CLASS_MAP[LoadingBarPrecedence.Low];

    public ngAfterViewInit(): void {
        this.appHeaderService.loadingBarStatusChange.subscribe(loadingBarStatus => this.loadingBarStatusChange(loadingBarStatus));
    }

    onLogoutClick(event: Event): void {
        this.authClient.logout().subscribe(() => { 
            window.location.reload();
        });
    }

    private setShowLoadingBar(showLoadingBar: boolean): void {
        this.displayProgessBar = showLoadingBar ? "visible" : "hidden";
    }

    private loadingBarStatusChange(loadingBarStatus: LoadingBarStatus): void {
        if (Object.entries(loadingBarStatus).length === 0) {
            this.displayProgessBar = "hidden";
        } else {
            this.displayProgessBar = "visible";
            this.progressBarClass = this.getLoadingBarClass(loadingBarStatus);
        }
    }

    private getLoadingBarClass(loadingBarStatus: LoadingBarStatus): string {
        let maxPrecedence: LoadingBarPrecedence = LoadingBarPrecedence.Low;
        Object.values(loadingBarStatus).forEach(loadingBarPrecedence => maxPrecedence = Math.max(maxPrecedence, loadingBarPrecedence));

        return LOADING_BAR_CLASS_MAP[maxPrecedence];
    }
}