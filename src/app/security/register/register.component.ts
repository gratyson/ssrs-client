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
    selector: "ssrs-register",
    templateUrl: "register.html",
    styleUrl: "register.css",
    standalone: true,
    imports: [ FormsModule, ReactiveFormsModule, MatGridListModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule ],
    host: { ["(document:keypress)"]: "onKeypress($event)" }
})
export class RegisterComponent {
 
    private authClient: AuthClient = inject(AuthClient);
    private router: Router = inject(Router);

    canRegister: boolean = true;

    warningMessage: string = "";

    username: string = "";
    password: string = ""; 
    reenterPassword: string = "";

    public ngOnInit(): void {
        this.authClient.canRegister().subscribe(result => this.canRegister = result);
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
        } else if (!this.password || !this.reenterPassword) {
            this.warningMessage = "Password is required";
        } else if (this.password != this.reenterPassword) {
            this.warningMessage = "Passwords do not match";
        } else {
            this.authClient.register(this.username, this.password, this.reenterPassword).subscribe(response => {
                if (response.success) {
                    this.router.navigate(["/"]);
                } else {
                    this.warningMessage = response.errMsg;
                }
            })
        }
    }
}