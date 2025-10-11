import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { Language } from "../../../language/language";
import { Word } from "../../../lexicon/model/word";
import { JapanesePitchAccentGuide } from "./japanese-pitch-accent-guide/japanese-pitch-accent-guide.component";
import { LanguagePronuncationGuide } from "./language-pronuncation-guide";

@Component({
    selector: "pronunciation-guide",
    templateUrl: "pronunciation-guide.html",
    styleUrl: "pronunciation-guide.css",
    imports: [JapanesePitchAccentGuide]
})
export class PronuncationGuide {

    readonly JAPANESE_LANGUAGE_ID: number = 1;

   @ViewChild("languagePronunciationGuide") languagePronunciationGuide: LanguagePronuncationGuide;

    @Input() language: Language | null;
    @Input() word: Word;

    @Output() hasPronunciationGuide: EventEmitter<boolean> = new EventEmitter<boolean>();

    onHasPronunciationGuideChange(hasPronunciationGuide: boolean): void {
        this.hasPronunciationGuide.emit(hasPronunciationGuide);
    }

    public updateWord(word: Word): void {
        if (this.languagePronunciationGuide) {
            this.languagePronunciationGuide.updateWord(word);
        }
    }
}