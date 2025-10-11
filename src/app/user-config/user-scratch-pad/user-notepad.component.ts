import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { Observable, Subject, debounceTime } from "rxjs";
import { UserNotepadClient } from "../../client/user-notepad-client";
import { Router } from "@angular/router";

const DEBOUNCE_TIME_MS: number = 3000;

@Component({
    selector: "user-notepad",
    templateUrl: "user-notepad.html",
    styleUrl: "user-notepad.css",
    imports: [FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule]
})
export class UserNotepadComponent {

    readonly MAX_CHARACTER_CNT: number = 1048576;

    private userNotepadClient: UserNotepadClient = inject(UserNotepadClient);
    private router: Router = inject(Router);

    canEditText: boolean = false;   // don't allow editing until saved text is loaded from server
    isTextSaved: boolean = false;
    notepadText: string = "";

    filterResult: Observable<void>;
    subject: Subject<void> = new Subject<void>();

    public ngOnInit(): void {
        this.userNotepadClient.getUserNotepadText().subscribe(text => {
            this.notepadText = text;
            this.canEditText = true;
        });

        this.filterResult = this.subject.pipe(debounceTime(DEBOUNCE_TIME_MS));
        this.filterResult.subscribe(() => this.saveChanges());
    }

    onClose(): void {
        if (!this.isTextSaved) {
            this.isTextSaved = true;
            this.userNotepadClient.saveUserNotepadText(this.notepadText).subscribe(() => {
                this.router.navigate(["/"]);
            })
        } else {
            this.router.navigate(["/"]);
        }
    }

    onInput(): void {
        this.isTextSaved = false;
        this.subject.next();
    }

    private saveChanges(): void {
        if (!this.isTextSaved) {
            this.userNotepadClient.saveUserNotepadText(this.notepadText).subscribe(() => {
                this.isTextSaved = true;
            });
        }
    }
}