import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({providedIn: "root"})
export class AppHeaderService {

    private showLoadingBar: boolean = false;
    private showLoadingBarSource: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    public showLoadingBarChange: Observable<boolean> = this.showLoadingBarSource.asObservable();

    public setShowLoadingBar(showLoadingBar: boolean, delayMs: number = 0): void {
        this.showLoadingBar = showLoadingBar;
        setTimeout(() => this.showLoadingBarSource.next(this.showLoadingBar), delayMs);
    }
}