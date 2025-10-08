import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { Word } from "../../../lexicon/model/word";
import { AudioPlayerComponent } from "../../../audio/components/audio-player/audio-player.component";
import { Language } from "../../../language/language";
import { ReviewAttributesComponent } from "../review-attributes/review-attributes.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { JapanesePitchAccentGuide } from "../pronounciation-guide/japanese-pitch-accent-guide/japanese-pitch-accent-guide.component";
import { PronuncationGuide } from "../pronounciation-guide/pronunciation-guide.component";

@Component({
    selector: "word-overview",
    templateUrl: "word-overview.html",
    styleUrl: "word-overview.css",
    standalone: true,
    imports: [AudioPlayerComponent, ReviewAttributesComponent, MatIconModule, MatButtonModule, PronuncationGuide ]
})
export class WordOverviewComponent {
    
    @Input() word: Word;
    @Input() language: Language | null;

    @Output() editWord: EventEmitter<Word> = new EventEmitter<Word>();

    @ViewChild("pronunciationGuide") pronunciationGuide: PronuncationGuide;

    pronunciationGuideDisplay: string = "none";

    public ngOnInit(): void {
        Object.keys(this.word.elements)
    }

    onEditWord(): void {
        this.editWord.emit(this.word);

        if (this.pronunciationGuide) {
            this.pronunciationGuide.updateWord(this.word);
        }
    }

    onHasPronunciationGuideChange(hasPronuncationGuide: boolean) {
        setTimeout(() => {
            this.pronunciationGuideDisplay = hasPronuncationGuide ? "block" : "none";
        });
    }
}