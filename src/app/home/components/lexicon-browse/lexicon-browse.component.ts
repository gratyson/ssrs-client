import { Component, inject } from "@angular/core";
import { LexiconClient } from "../../../client/lexicon-client";
import { LexiconMetadata } from "../../../lexicon/model/lexicon";
import { LexiconSelectComponent } from "../lexicon-select/lexicon-select.component";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from "@angular/material/dialog";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { LexiconMetadataEditDialogComponent } from "../lexicon-metadata-edit-dialog/lexicon-metadata-edit-dialog.component";
import { Router } from "@angular/router";
import { MatMenuModule } from "@angular/material/menu";
import { UserConfigService } from "../../../user-config/user-config.service";
import { ReviewTodaysWordsEarly } from "../../../user-config/user-config-setting";
import { getEndOfDay } from "../../../util/date-util";

@Component({
    selector: "lexicon-browse",
    templateUrl: "lexicon-browse.html",
    styleUrl: "lexicon-browse.css",
    standalone: true,
    imports: [ LexiconSelectComponent, MatIconModule, MatButtonModule, MatMenuModule, MatCheckboxModule ],
})
export class LexiconBrowseComponent {

    private lexiconClient = inject(LexiconClient);
    private userConfigService: UserConfigService = inject(UserConfigService)
    
    constructor(private dialog: MatDialog, 
                private router: Router) { }

    lexiconMetadatas: LexiconMetadata[] = [];
    scheduledReviewCounts: { [k:string]: number }[] = [];
    hasWordsToLearn: boolean[] = [];
    reviewTodaysWordsEarly: boolean = false;

    public ngOnInit(): void {
        this.userConfigService.getCurrentConfigValue(ReviewTodaysWordsEarly).subscribe(reviewTodaysWordsEarly => {
            this.reviewTodaysWordsEarly = reviewTodaysWordsEarly; 
            this.loadAllLexicons();
        });
    }

    onNewLexicon(event: Event): void {
        const dialogRef = this.dialog.open(LexiconMetadataEditDialogComponent, {
            data: "", 
            height: LexiconMetadataEditDialogComponent.DEFAULT_HEIGHT,
            width: LexiconMetadataEditDialogComponent.DEFAULT_WIDTH,
            disableClose: true,
            autoFocus: true,
        });

        dialogRef.afterClosed().subscribe(result =>
            {
                if (result) {
                    this.openLexicon(result as string);
                }
            });
    }

    onRefresh(event: Event): void {
        this.loadAllLexicons();
    }

    onReviewTodaysWordsEarly(): void {
        this.reviewTodaysWordsEarly = !this.reviewTodaysWordsEarly;
        this.userConfigService.setCurrentConfigValue(ReviewTodaysWordsEarly, this.reviewTodaysWordsEarly);
        this.loadAllLexicons();
    }

    openLexicon(lexiconId: string): void {
        this.router.navigate(["/app/editLexicon", lexiconId]);
    }

    private loadAllLexicons(): void {
        let cutoff: Date | null = this.reviewTodaysWordsEarly ? getEndOfDay() : null;

        this.lexiconClient.loadAllLexiconMetadataAndScheduledCounts(cutoff).subscribe((lexiconMetadataAndScheduledCounts) => {
            this.lexiconMetadatas = [];
            this.scheduledReviewCounts = [];
            this.hasWordsToLearn = [];
            
            lexiconMetadataAndScheduledCounts.forEach((lexiconMetadataAndScheduledCount) => {
                this.lexiconMetadatas.push(lexiconMetadataAndScheduledCount.lexiconMetadata);
                this.scheduledReviewCounts.push(lexiconMetadataAndScheduledCount.scheduledReviewCounts);
                this.hasWordsToLearn.push(lexiconMetadataAndScheduledCount.hasWordsToLearn);
            });
            
        });
    }



}