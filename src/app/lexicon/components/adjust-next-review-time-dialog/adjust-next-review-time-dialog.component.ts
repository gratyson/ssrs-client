import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatRadioButton, MatRadioChange, MatRadioModule } from "@angular/material/radio";
import { Duration } from "../../../util/duration/duration";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "adjust-next-review-time-dialog",
    templateUrl: "adjust-next-review-time-dialog.html",
    styleUrl: "adjust-next-review-time-dialog.css",
    imports: [MatInputModule, MatFormFieldModule, FormsModule, MatRadioModule, MatButtonModule]
})
export class AdjustNextReviewTimeDialogComponent {
    public static readonly DEFAULT_WIDTH: string = "20em";

    constructor(public dialogRef: MatDialogRef<AdjustNextReviewTimeDialogComponent, Duration>) { }

    adjustmentAmount: number = 0;
    selectedUnit: string = "days";

    onCancel(): void {
        this.dialogRef.close(Duration.fromMillis(0));
    }

    onAccept(): void {
        if (this.selectedUnit === "hours") {
            this.dialogRef.close(Duration.fromHours(this.adjustmentAmount));
        } else {
            this.dialogRef.close(Duration.fromDays(this.adjustmentAmount));
        }
    }

    onSelectedUnitChange(matRadioChange: MatRadioChange) {
        this.selectedUnit = matRadioChange.value;
    }

}