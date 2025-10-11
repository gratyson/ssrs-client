import { Component, Inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import {
    MatDialog,
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
  } from '@angular/material/dialog';

@Component({
    selector: "confirm-dialog",
    template: `
        <h2 mat-dialog-title>{{ data.title }}</h2>
        <mat-dialog-content>{{ data.message }}</mat-dialog-content>
        
        <mat-dialog-actions class="dialog-actions">
            <button mat-button mat-dialog-close color="primary">{{ data.cancelAction }}</button>
            <button mat-button [mat-dialog-close]="true" color="primary">{{ data. confirmAction }}</button>
        </mat-dialog-actions>
    `,
    styles: `
    `,
    imports: [MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose]
})
export class ConfirmDialog {
    private static readonly DIALOG_DATA_DEFAULTS: ConfirmDialogData = {
        title: "Are you sure?",
        message: "",
        confirmAction: "Yes",
        cancelAction: "No"
    };

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialog, boolean>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    ) {
        this.data = this.applyDefaults(data, ConfirmDialog.DIALOG_DATA_DEFAULTS);
    }

    private applyDefaults<T extends { [k:string]: any }>(data: T, defaults: T): T {
        let dataToReturn: T = {} as T;
     
        let key: keyof T;
        for(key in defaults) {
            dataToReturn[key] = data[key] === undefined ?  defaults[key] : data[key];
        }
    
        return dataToReturn;
    }
}

export interface ConfirmDialogData {
    title?: string;
    message?: string;
    confirmAction?: string;
    cancelAction?: string;
}