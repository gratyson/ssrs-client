import { Component, EventEmitter, Input, Output, SimpleChanges, inject } from "@angular/core";
import { LexiconMetadata } from "../../../lexicon/model/lexicon";
import { LexiconClient } from "../../../client/lexicon-client";
import { MatMenuModule } from '@angular/material/menu'; 
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { LanguageService } from "../../../language/language-service";
import { Language, TestRelationship } from "../../../language/language";
import { getEndOfDay } from "../../../util/date-util";

@Component({
    selector: "lexicon-selection",
    templateUrl: "lexicon-select.html",
    styleUrl: "lexicon-select.css",
    imports: [MatMenuModule, MatIconModule, MatButtonModule, MatFormFieldModule, FormsModule, RouterLink]
})
export class LexiconSelectComponent {

    private readonly REVIEW_BUTTON_TEXT: string  = "Review"

    private lexiconClient: LexiconClient = inject(LexiconClient);
    private languageService: LanguageService = inject(LanguageService);

    @Input() lexiconMetadata: LexiconMetadata;
    @Input() scheduledReviewCounts: { [k:string]: number } = {};
    @Input() hasWordsToLearn: boolean;
    @Input() reviewToEod: boolean;

    lexiconImagePath: string;
    reviewButtonText: string = this.REVIEW_BUTTON_TEXT;
    totalReviewCount: number = 0;
    language: Language | null = null;
    relationshipReadyForReviewCnts: { relationship: TestRelationship, cnt: number}[] = [];

    @Output() onEditLexicon: EventEmitter<void> = new EventEmitter<void>();

    public ngOnInit(): void {
        this.lexiconImagePath = this.lexiconClient.getImagePath(this.lexiconMetadata);

        this.languageService.getLanguage(this.lexiconMetadata.languageId).subscribe((language) => {
            if (language) {
                this.language = language;
                
                this.updateReviewCnts();
            }
        });    
    }

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("scheduledReviewCounts")) {
            this.updateReviewCnts();
        }
    }

    endOfDayStr(): String {
        return getEndOfDay().toISOString();
    }

    private updateReviewCnts(): void {
        if (this.language != null) {
            this.relationshipReadyForReviewCnts = [];
            this.totalReviewCount = 0;

            for(let testRelationship of this.language.testRelationships) {
                if (this.scheduledReviewCounts[testRelationship.id] > 0) {
                    this.relationshipReadyForReviewCnts.push({ relationship: testRelationship, cnt: this.scheduledReviewCounts[testRelationship.id] });
                    this.totalReviewCount += this.scheduledReviewCounts[testRelationship.id];
                }
            }

            if (this.totalReviewCount > 0) {
                this.reviewButtonText = `${this.REVIEW_BUTTON_TEXT} (${this.totalReviewCount})`;
            } else {
                this.reviewButtonText = this.REVIEW_BUTTON_TEXT;
            }
        }
    }
}