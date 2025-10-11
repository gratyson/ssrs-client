import { Component, Input, ViewChild, inject } from "@angular/core";
import { LexiconClient } from "../../../client/lexicon-client";
import { EMPTY_WORD_FILTER_OPTIONS, WordClient, WordFilterOptions } from "../../../client/word-client";
import { Lexicon, LexiconMetadata, LexiconReviewHistory } from "../../model/lexicon";
import { LanguageService } from "../../../language/language-service";
import { LexiconEditHeaderComponent } from "../lexicon-edit-header/lexicon-edit-header.component";
import { Language, WordElement } from "../../../language/language";
import { MatDialog } from "@angular/material/dialog";
import { LexiconMetadataEditDialogComponent } from "../../../home/components/lexicon-metadata-edit-dialog/lexicon-metadata-edit-dialog.component";
import { Word } from "../../model/word";
import { LexiconWordRowAddComponent } from "../lexicon-word-row/lexicon-word-row-add";
import { LexiconWordRowFilterComponent } from "../lexicon-word-row/lexicon-word-row-filter";
import { WordParser } from "../../import/word-parser";
import { MatSnackBar } from "@angular/material/snack-bar";
import { AudioClient } from "../../../client/audio-client";
import { environment } from "../../../../environments/environment";
import { LexiconWordRowEditBatchComponent } from "../lexicon-word-row-edit-batch/lexicon-word-row-edit-batch.component";
import { ConfirmDialog } from "../../../util/confirm-dialog";
import { Router } from "@angular/router";
import { Observable, lastValueFrom, of } from "rxjs";
import { ViewReviewHistoryComponent } from "../view-review-history/view-review-history.component";
import { WordWriter } from "../../import/word-writer";
import { AdjustNextReviewTimeDialogComponent } from "../adjust-next-review-time-dialog/adjust-next-review-time-dialog.component";
import { ReviewSessionClient } from "../../../client/review-session-client";

@Component({
    selector: "lexicon-edit",
    templateUrl: "lexicon-edit.html",
    styleUrl: "lexicon-edit.css",
    providers: [LexiconClient, WordClient],
    imports: [LexiconEditHeaderComponent, LexiconWordRowAddComponent, LexiconWordRowFilterComponent, LexiconWordRowEditBatchComponent, ViewReviewHistoryComponent]
})
export class LexiconEdit {
    private lexiconClient: LexiconClient = inject(LexiconClient);
    private wordClient: WordClient = inject(WordClient);
    private audioClient: AudioClient = inject(AudioClient);
    private reviewSessionClient: ReviewSessionClient = inject(ReviewSessionClient);
    private languageService: LanguageService = inject(LanguageService);
    private wordParse: WordParser = inject(WordParser);
    private wordWriter: WordWriter = inject(WordWriter);

    @ViewChild(LexiconWordRowEditBatchComponent) baseWordRowEditBatch: LexiconWordRowEditBatchComponent;

    @Input() lexiconId: string;    

    lexiconMetadata: LexiconMetadata;
    language: Language;
    languageString: string;
    newWordOffsetAdjustment: number = 0;
    newWords: Word[] = [];

    wordFilterOptions: WordFilterOptions = EMPTY_WORD_FILTER_OPTIONS;
    reviewHistoryView: LexiconReviewHistory | null = null;

    constructor(private dialog: MatDialog, 
                private snackBar: MatSnackBar,
                private router: Router) {}

    public ngOnInit() {
        this.LoadLexicon(this.lexiconId);
    }

    private LoadLexicon(lexiconId: string) {
        this.lexiconClient.loadLexicon(this.lexiconId).subscribe(lexicon => this.UpdateLexicon(lexicon));
    }

    private UpdateLexicon(lexicon: Lexicon) {
        this.UpdateLexiconMetadata(lexicon);
        this.languageService.getLanguage(lexicon.languageId).subscribe((language) => this.UpdateLanguage(language));
    }

    private UpdateLexiconMetadata(lexiconMetadata: LexiconMetadata) {
        this.lexiconMetadata = lexiconMetadata;
    }

    private UpdateLanguage(language: Language | undefined) {
        if (language != undefined) {
            this.language = language;
            this.languageString = JSON.stringify(this.language);
        }
    } 

    onNewWord(word: Word) {
        this.newWords.unshift(word);
    }

    onWordFilterUpdate(wordFilterOptions: WordFilterOptions) {
        this.wordFilterOptions = wordFilterOptions;
    }

    onEditLexiconMetadata() {
        const dialogRef = this.dialog.open(LexiconMetadataEditDialogComponent, {
            data: this.lexiconId, 
            height: LexiconMetadataEditDialogComponent.DEFAULT_HEIGHT,
            width: LexiconMetadataEditDialogComponent.DEFAULT_WIDTH
          });

          dialogRef.afterClosed().subscribe(result => this.LoadLexicon(this.lexiconId))
    }

    onLoadWordsFromFile(file: File) {
        this.wordParse.parseFile(this.language, this.lexiconId, file).subscribe((wordParseResult) => {
            let message: string = `${wordParseResult.words.length} words saved. `;

            if (wordParseResult.failedValidation > 0) {
                message += `${wordParseResult.failedValidation} words failed validation and were skipped. `;
            }
            if (wordParseResult.skipped > 0) {
                message += `${wordParseResult.skipped} words already existed and were skipped. `;
            }
      
            this.snackBar.open(message, "", { duration: 5000 });

            this.baseWordRowEditBatch.mergeNewReviewHistory(wordParseResult.reviewHistoryById);
            this.newWords = wordParseResult.words.reverse().concat(this.newWords);
        });
    }

    onLoadAudioFromFiles(files: FileList) {
        // Batch loading uses an offset rather than an absolute position. Uploading audio in-between batch call will affect the results and therefore
        // end up missing rows, so load all words up-front before uploading any audio. 
        this.LoadAllWordsWithNoAudio().then(words => {
            this.ProcessAudioFromFiles(files, words);
        })
    }

    onExportLexicon(includeHistory: boolean) {
        this.wordWriter.GenerateLexiconWordsTsvBlob(this.language, this.lexiconId, includeHistory, this.wordFilterOptions).subscribe(blob => {
            const elem: HTMLAnchorElement = window.document.createElement('a');
            elem.href = window.URL.createObjectURL(blob);
            elem.download = this.lexiconId + ".txt";
            document.body.appendChild(elem);
            elem.click();        
            window.URL.revokeObjectURL(elem.href);
            document.body.removeChild(elem);
        });
    }

    onCloseHistory(): void {
        this.reviewHistoryView = null;
    }

    async LoadAllWordsWithNoAudio(offset: number = 0): Promise<Word[]> {       
        
        let wordsWithoutAudio: Word[] = await lastValueFrom(this.wordClient
            .loadWordsBatch(this.lexiconId, environment.LOAD_AUDIO_FROM_FILES_LOAD_BATCH_SIZE, offset, { elements: {}, attributes: "", learned: null, hasAudio: false }));

        if (wordsWithoutAudio.length === environment.LOAD_AUDIO_FROM_FILES_LOAD_BATCH_SIZE) {
            return wordsWithoutAudio.concat(await this.LoadAllWordsWithNoAudio(offset + environment.LOAD_AUDIO_FROM_FILES_LOAD_BATCH_SIZE));
        }
        return wordsWithoutAudio;
    }

    async ProcessAudioFromFiles(files: FileList, words: Word[], offset: number = 0) {
        const wordsToProcess = words.slice(offset, offset + environment.LOAD_AUDIO_FROM_FILES_UPDATE_BATCH_SIZE);
        
        this.LoadAudioForWords(files, wordsToProcess).subscribe((results) => {
            this.baseWordRowEditBatch.updateAudio(results);

            const nextOffset = offset + environment.LOAD_AUDIO_FROM_FILES_UPDATE_BATCH_SIZE;
            if (nextOffset < words.length) {
                this.ProcessAudioFromFiles(files, words, nextOffset);
            }
        });
    }

    LoadAudioForWords(files: FileList, words: Word[]): Observable<{[k:string]: string[]}> {
        let wordIdsToSave: string[] = [];
        let filesToSave: File[] = [];

        for(let word of words) {            
            const audioRegex = this.GetAudioRegex(word);

            for(let i = 0; i< files.length; i++) {
                const file: File = files[i];
                if (audioRegex.test(file.name)) {
                    console.log(`Saving audio file ${file.name} for word ${word.id}. File length: ${file.size}`);
                    wordIdsToSave.push(word.id);
                    filesToSave.push(file);
                }
            }
        }

        if (wordIdsToSave.length > 0) {
            return this.audioClient.saveAudioBatch(wordIdsToSave, filesToSave);
        }

        return of({});
    }

    GetAudioRegex(word: Word): RegExp {
        let regex: string = this.language.audioFileRegex;

        for(let element of this.language.validElements) {
            regex = regex.replaceAll(`%${element.id}%`, word.elements[element.id]);
        }

        return new RegExp(regex);
    }

    onDeleteLexicon() {
        const dialogRef = this.dialog.open(ConfirmDialog, {
            data: { 
                title: "Delete Lexicon?", 
                message: `Delete '${this.lexiconMetadata.title}' entirely, including all words, history, audio, and images?`,
                confirmAction: "Delete",
                cancelAction: "Cancel",
            },
        });

        dialogRef.afterClosed().subscribe(result => { 
            if (result) {
                this.lexiconClient.deleteLexicon(this.lexiconId).subscribe(deleted => {
                    if (deleted) {
                        this.router.navigate(['/']);
                    } else {
                        console.log("Failed to delete lexicon");
                    }
                });
                
            }
        });
    }

    onAdjustNextReviewTime() {
        const dialogRef = this.dialog.open(AdjustNextReviewTimeDialogComponent, {
            width: AdjustNextReviewTimeDialogComponent.DEFAULT_WIDTH
        });

        dialogRef.afterClosed().subscribe(result => { 
            if (result && result.toHours() !== 0) {
                this.reviewSessionClient.adjustNextReviewTimes(this.lexiconId, result).subscribe(() => {
                    this.baseWordRowEditBatch.reloadReviewHistory();
                });
            }
        });
    }
}