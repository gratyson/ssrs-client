import { Component, Input, inject } from "@angular/core";
import { WordClient } from "../../../client/word-client";
import { UserConfigService } from "../../../user-config/user-config.service";
import { ReviewMode, ReviewType, WordReview } from "../../model/review-session";
import { Word } from "../../../lexicon/model/word";
import { Observable, map, of, switchMap } from "rxjs";
import { LexiconClient } from "../../../client/lexicon-client";
import { Lexicon, LexiconMetadata } from "../../../lexicon/model/lexicon";
import { ReviewContainerComponent } from "../review-container/review-container.component";
import { ReviewSessionClient } from "../../../client/review-session-client";
import { WordsToLearnCount, WordsToLearnIntroductionBatchSize, WordsToLearnTestsBetweenIntroduction } from "../../../user-config/user-config-setting";

@Component({
    selector: "learning-session",
    template: `
        <review-container [reviewTitle]="title" 
                          [reviewWords]="reviewWords" 
                          [lexiconId]="lexiconId" 
                          [introductionBatchSize]="introductionBatchSize" 
                          [testsBetweenIntroduction]="testsBetweenIntroduction"/>`,
    standalone: true,
    imports: [ ReviewContainerComponent ]
})
export class LearningSessionComponent {
    
    private lexiconClient: LexiconClient = inject(LexiconClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private userConfigService: UserConfigService = inject(UserConfigService);

    @Input() lexiconId: string;

    reviewWords: WordReview[][] = [];
    title: string = "Learning Lexicon";
    introductionBatchSize: number = 0;
    testsBetweenIntroduction: number = 0;

    private lexiconName: string;
    private wordCnt: number;

    public ngOnInit(): void {
        this.lexiconClient.loadLexiconMetadata(this.lexiconId).subscribe((lexiconMetadata) => {
            this.lexiconName = lexiconMetadata.title;
            this.title = this.buildTitle();
        });
        this.getReviewWords().subscribe((reviewWords) => {
            this.reviewWords = reviewWords;
            this.wordCnt = reviewWords.length;
            this.title = this.buildTitle();
        });

        this.userConfigService.getCurrentConfigValue(WordsToLearnIntroductionBatchSize).subscribe(introductionBatchSize => this.introductionBatchSize = introductionBatchSize);
        this.userConfigService.getCurrentConfigValue(WordsToLearnTestsBetweenIntroduction).subscribe(testsBetweenIntroduction => this.testsBetweenIntroduction = testsBetweenIntroduction);
    }

    private getReviewWords(): Observable<WordReview[][]> {
        return this.userConfigService.getCurrentConfigValue(WordsToLearnCount).pipe(switchMap((wordCnt) =>  {
            return this.reviewSessionClient.generateLearningSession(this.lexiconId, wordCnt)
        }));
    }

    private buildTitle(): string {
        console.log(this.lexiconName);
        if (this.lexiconName) {
            if (this.wordCnt) {
                return `Learning ${this.lexiconName} (${this.wordCnt} words)`;
            }
            return `Learning ${this.lexiconName}`;
        }
        return "Learning Lexicon";
    }
    
}