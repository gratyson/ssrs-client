import { Component, EventEmitter, Input, Output, SimpleChanges } from "@angular/core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { Observable, Subscription, interval, timer } from "rxjs";

@Component({
    selector: "countdown-timer",
    templateUrl: "countdown-timer.html",
    styleUrl: "countdown-timer.css",
    standalone: true,
    imports: [ MatProgressSpinnerModule ]
})
export class CountdownTimerComponent {

    @Input() strokeWidth: number = 14;
    @Input() diameter: number = 50;
    @Input() isPaused: boolean = false;

    @Output() OnCountdownComplete: EventEmitter<void> = new EventEmitter<void>();

    countdownSec: number = 0;

    private isShutdown: boolean = false;
    private tickMillis: number = 10;
    
    private tickerNum: number = 0;

    remaining: number = 0;

    public ngOnDestroy(): void {
        this.isShutdown = true;
    }

    public start(countdownSec: number): void {
        this.tickerNum++;
        
        if (countdownSec > 0) {
            this.tickMillis = countdownSec * 10;
            this.remaining = 100;
            
            timer(this.tickMillis).subscribe(() => this.tick(this.tickerNum));
        } else {
            this.remaining = 0;
        }
    }

    public stop(): void {
        this.remaining = 0;
        this.tickerNum++;
    }

    public pause(): void {
        this.isPaused = true;
    }

    public unpause(): void {
        this.isPaused = false;
    }

    private tick(tickerNum: number): void {
        if (this.tickerNum === tickerNum) {   // don't update remaining, reschedule, or emit if ticker has been changed
            if (this.remaining > 0) {
                if(!this.isPaused) {
                    this.remaining--;
                }
                if (!this.isShutdown) {
                    timer(this.tickMillis).subscribe(() => this.tick(tickerNum));
                }
            } else {
                this.OnCountdownComplete.emit();
            }
        }
    }
}