import { Component, inject } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AuthClient } from "../../../client/auth-client";
import { UserService } from "../../../security/user-service";
import { Router, RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { AppHeaderService } from "./app-header-service";

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

    public ngAfterViewInit(): void {
        this.appHeaderService.showLoadingBarChange.subscribe(showLoadingBar => this.setShowLoadingBar(showLoadingBar));
    }

    onLogoutClick(event: Event): void {
        this.authClient.logout().subscribe(() => { 
            window.location.reload();
        });
    }

    private setShowLoadingBar(showLoadingBar: boolean): void {
        this.displayProgessBar = showLoadingBar ? "visible" : "hidden";
    }
}