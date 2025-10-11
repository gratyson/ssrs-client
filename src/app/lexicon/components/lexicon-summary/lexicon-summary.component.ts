import { Component, Input, inject } from "@angular/core";
import { ReviewSessionClient } from "../../../client/review-session-client";
import { UserConfigService } from "../../../user-config/user-config.service";
import { LexiconSummaryGraphDayCount } from "../../../user-config/user-config-setting";
import { Duration } from "../../../util/duration/duration";
import { FutureReviewEvent } from "../../model/lexicon";
import { NgxChartsModule } from "@swimlane/ngx-charts";
import { DatePipe } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";

@Component({
    selector: "lexicon-summary",
    templateUrl: "lexicon-summary.html",
    styleUrl: "lexicon-summary.css",
    imports: [NgxChartsModule, MatButtonModule, MatIconModule, RouterLink]
})
export class LexiconSummaryComponent {

    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private userConfigService: UserConfigService = inject(UserConfigService);

    @Input() lexiconId: string;

    totalWords: number = 0;
    learnedWords: number = 0;
    futureEventCountGraphSeries: GraphSeries[] = [];

    public ngOnInit(): void {
        this.buildGraphValues();
    }

    dateFormatterLC(date: string): string {
        const datePipe = new DatePipe("en-US");
        let formatted = datePipe.transform(date, "MMM, d");
        return formatted ? formatted : date;
    }

    private buildGraphValues(): void {
        this.userConfigService.getCurrentConfigValue(LexiconSummaryGraphDayCount).subscribe(dayCount => {
            this.initFutureEventCountsByDay(dayCount);
            const cutoff = new Date(this.getStartOfDay(new Date()).valueOf() + Duration.fromDays(dayCount + 1).toMillis());  

            this.reviewSessionClient.getLexiconReviewSummary(this.lexiconId, cutoff).subscribe(lexiconReviewSummary => {
                this.totalWords = lexiconReviewSummary.totalWords;
                this.learnedWords = lexiconReviewSummary.learnedWords;

                let futureEventCountsByDay: { [k:string]: EventCounts } = this.countFutureReviewEventsByDay(lexiconReviewSummary.futureReviewEvents, dayCount);
                this.futureEventCountGraphSeries = this.convertToGraphSeries(futureEventCountsByDay);
            });
        });
    }

    private countFutureReviewEventsByDay(futureReviewEvents: FutureReviewEvent[], dayCount: number): { [k:string]: EventCounts } {
        let futureEventCountsByDay: { [k:string]: EventCounts } = this.initFutureEventCountsByDay(dayCount);
        const now: Date = new Date();

        futureReviewEvents.forEach(futureReviewEvent => {
            let date = futureReviewEvent.reviewInstant < now ? now : futureReviewEvent.reviewInstant;

            let dateStr = this.toDateStr(date);
            if (futureEventCountsByDay[dateStr]) {
                if (!futureReviewEvent.inferred) {
                    futureEventCountsByDay[dateStr].scheduled += 1;
                }
                futureEventCountsByDay[dateStr].expected += 1;
            }             
        });

        return futureEventCountsByDay;
    }

    private convertToGraphSeries(futureEventCountsByDay: { [k:string]: EventCounts }): GraphSeries[] {
        let expectedSeries: GraphSeriesValue[] = [];
        let scheduledSeries: GraphSeriesValue[] = [];

        for(let dateStr of Object.keys(futureEventCountsByDay)) {
            expectedSeries.push({ "value": futureEventCountsByDay[dateStr].expected, "name": dateStr });
            scheduledSeries.push({ "value": futureEventCountsByDay[dateStr].scheduled, "name": dateStr});
        }

        return [ {"name": "Scheduled Review Events", "series": scheduledSeries }, { "name": "Expected Review Events", "series": expectedSeries} ];
    }

    private getStartOfDay(date: Date): Date {
        return new Date(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0));
    }

    private initFutureEventCountsByDay(dayCount: number): { [k:string]: EventCounts } {      
        let futureEventCountsByDay: { [k:string]: EventCounts } = {};
        
        let date: Date = new Date();
        futureEventCountsByDay[this.toDateStr(date)] = { scheduled: 0, expected: 0 };

        for(let i = 0; i < dayCount; i++) {
            date = new Date(date.valueOf() + Duration.fromDays(1).toMillis());
            futureEventCountsByDay[this.toDateStr(date)] = { scheduled: 0, expected: 0 };
        }

        return futureEventCountsByDay;
    }

    private toDateStr(date: Date): string {
        return this.getStartOfDay(date).toUTCString();
    }
    
}

interface EventCounts {
    scheduled: number;
    expected: number;
}

type GraphSeriesValue = { "value": number, "name": string };
type GraphSeries = { "name": string, "series": GraphSeriesValue[] };