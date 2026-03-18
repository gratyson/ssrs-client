import { Component, inject } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { AuthClient } from "../../client/auth-client";
import { Router } from "@angular/router";

@Component({
    selector: "ssrs-change-password",
    templateUrl: "change-password.html",
    styleUrl: "change-password.css",
    imports: [FormsModule, ReactiveFormsModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
    host: { ["(document:keypress)"]: "onKeypress($event)" }
})
export class ChangePasswordComponent {

    private authClient: AuthClient = inject(AuthClient);
    private router: Router = inject(Router);

    warningMessage: string = "";

    oldPassword: string = ""; 
    newPassword: string = "";
    reEnterNewPassword: string = "";
 
    
    onKeypress(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.submit();
        } 
    }

    onSubmit(event: Event): void {
        this.submit();
    }

    private submit(): void {
        if (!this.oldPassword || !this.newPassword || !this.reEnterNewPassword) {
            this.warningMessage = "Password is required";
        } else if (this.newPassword != this.reEnterNewPassword) {
            this.warningMessage = "New passwords do not match";
        } else {
            this.authClient.changePassword(this.oldPassword, this.newPassword, this.reEnterNewPassword).subscribe(response => {
                if (response.success) {
                    this.router.navigate(["/"]);
                } else {
                    this.warningMessage = response.errMsg;
                }
            })
        }
    }
}