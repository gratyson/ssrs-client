import { Component, Input, inject } from "@angular/core";
import { ReviewSessionClient } from "../../../client/review-session-client";
import { UserConfigService } from "../../../user-config/user-config.service";
import { MaxWordsToReviewPerSession } from "../../../user-config/user-config-setting";
import { WordReview } from "../../model/review-session";
import { ReviewContainerComponent } from "../review-container/review-container.component";
import { LexiconClient } from "../../../client/lexicon-client";

@Component({
    selector: "review-session",
    template: `
        <review-container [reviewTitle]="title" 
                          [reviewWords]="reviewWordsQueues" 
                          [lexiconId]="lexiconId" />
    `,
    standalone: true,
    imports: [ ReviewContainerComponent ],
})
export class ReviewSessionComponent {

    private lexiconClient: LexiconClient = inject(LexiconClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private userConfigService: UserConfigService = inject(UserConfigService);

    @Input() lexiconId: string;
    @Input() testRelationship: string = "";
    @Input() cutoff: string = "";

    title: string = "Reviewing Lexicon";
    reviewWordsQueues: WordReview[][] = [];

    private lexiconName: string = "";
    private wordCnt: number = 0;

    public ngOnInit(): void {        
        let cutoffDate: Date;
        if (this.cutoff) {
            cutoffDate = new Date(this.cutoff);
        } else {
            cutoffDate = new Date();
        }

        this.title = this.buildTitle();

        this.lexiconClient.loadLexiconMetadata(this.lexiconId).subscribe((lexiconMetadata) => {
            this.lexiconName = lexiconMetadata.title;
            this.title = this.buildTitle();
        });

        this.userConfigService.getCurrentConfigValue(MaxWordsToReviewPerSession).subscribe((maxWordCnt) => {
            this.reviewSessionClient.generateReviewSession(this.lexiconId, this.testRelationship, maxWordCnt, cutoffDate).subscribe((reviewWords) => {
                this.wordCnt = reviewWords.length;
                this.title = this.buildTitle();
                
                this.reviewWordsQueues = [];
                reviewWords.forEach(reviewWord => this.reviewWordsQueues.push([reviewWord]));
                
            })
        })
    }

    private buildTitle(): string {
        if (this.lexiconName) {
            if (this.wordCnt) {
                return `Reviewing ${this.lexiconName} (${this.wordCnt} words)`;
            }
            return `Reviewing ${this.lexiconName}`;
        }
        return "Reviewing Lexicon";
    }
}