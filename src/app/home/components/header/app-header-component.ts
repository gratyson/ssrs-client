import { Component, inject } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AuthClient } from "../../../client/auth-client";
import { environment } from "../../../../environments/environment";
import { UserService } from "../../../security/user-service";
import { Router, RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";

@Component({
    selector: "app-header",
    templateUrl: "app-header.html",
    styleUrl: "app-header.css",
    standalone: true,
    imports: [ MatFormFieldModule, MatIconModule, MatButtonModule, MatMenuModule, RouterLink ],
})
export class AppHeaderComponent {

    userService: UserService = inject(UserService);
    authClient: AuthClient = inject(AuthClient);
    router: Router = inject(Router);

    logoutPath: string = "";

    public ngOnInit(): void {
        this.logoutPath = new URL("logout", document.baseURI).toString();
    }

    onLogoutClick(event: Event): void {
        this.authClient.logout().subscribe(() => { 
            window.location.reload();
        });
    }
}