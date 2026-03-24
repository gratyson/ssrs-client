import { Component, inject } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { AuthClient } from "../../client/auth-client";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { CacheService } from "../../util/cache-service";
import { USER_CONFIG_CACHE_KEY } from "../../user-config/user-config.service";
import { AppHeaderService } from "../../home/components/header/app-header-service";
import { finalize } from "rxjs";

@Component({
    selector: "ssrs-login",
    templateUrl: "login.html",
    styleUrl: "login.css",
    imports: [FormsModule, ReactiveFormsModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
    host: { ["(document:keypress)"]: "onKeypress($event)" }
})
export class LoginComponent { 

    private authClient: AuthClient = inject(AuthClient);
    private cacheService: CacheService = inject(CacheService);
    private router: Router = inject(Router);
    private appHeaderService: AppHeaderService = inject(AppHeaderService);

    canRegister = false;

    warningMessage: string = "";

    username: string = "";
    password: string = "";

    public ngOnInit(): void {
        this.authClient.canRegister().subscribe(response => this.canRegister = response);
    }

    onKeypress(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.submit();
        } 
    }

    onSubmit(event: Event): void {
        this.submit();
    }

    private submit(): void {
        if (!this.username) {
            this.warningMessage = "Username is required";
        } else if(!this.password) {
            this.warningMessage = "Password is required";
        } else {
            this.appHeaderService.setShowLoadingBar(true, 100);
            this.authClient.login(this.username, this.password).pipe(finalize(() => this.appHeaderService.setShowLoadingBar(false))).subscribe(response => {
                if (response.success) {
                    this.cacheService.clearValue(USER_CONFIG_CACHE_KEY);
                    this.router.navigate(["/"]);
                } else {
                    this.warningMessage = response.errMsg;
                }
            });
        }
    }
}