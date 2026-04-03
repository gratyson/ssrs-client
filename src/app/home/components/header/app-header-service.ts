import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

const CLEAR_LOADING_BAR_DELAY_MS: number = 50;  // short delay before clearing the loading bar to prevent 'stuttering' if chaining multiple calls that use loading bars

@Injectable({providedIn: "root"})
export class AppHeaderService {
    
    private loadingBarStatus: LoadingBarStatus = {};
    private loadingBarStatusSource: BehaviorSubject<LoadingBarStatus> = new BehaviorSubject<LoadingBarStatus>({});

    public loadingBarStatusChange: Observable<LoadingBarStatus> = this.loadingBarStatusSource.asObservable();

    public showLoadingBar(source: any, precedence: LoadingBarPrecedence = LoadingBarPrecedence.Low, delayMs: number = 0): void {
        this.loadingBarStatus[this.getSourceName(source)] = precedence;
        setTimeout(() => this.loadingBarStatusSource.next(this.loadingBarStatus), delayMs);
    }

    public clearLoadingBar(source: any): void {
        delete this.loadingBarStatus[this.getSourceName(source)];
        setTimeout(() => this.loadingBarStatusSource.next(this.loadingBarStatus), CLEAR_LOADING_BAR_DELAY_MS);
    }

    private getSourceName(source: any): string {
        if (source === null || source === undefined) {
            return "null";
        }

        if (typeof source !== 'object' && typeof source !== 'function') {
            return "str" + String(source);
        }

        return "obj" + (source.constructor?.name ?? "unknown");
    }
}

export type LoadingBarStatus = { [k: string]: LoadingBarPrecedence };

export enum LoadingBarPrecedence {
    High = 2,
    Medium = 1,
    Low = 0
};