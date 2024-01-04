import { Component, EventEmitter, Input, Output } from "@angular/core";
import { Word } from "../../../lexicon/model/word";
import { AudioPlayerComponent } from "../../../audio/components/audio-player/audio-player.component";
import { Language } from "../../../language/language";
import { ReviewAttributesComponent } from "../review-attributes/review-attributes.component";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: "word-overview",
    templateUrl: "word-overview.html",
    styleUrl: "word-overview.css",
    standalone: true,
    imports: [ AudioPlayerComponent, ReviewAttributesComponent, MatIconModule, MatButtonModule ]
})
export class WordOverviewComponent {
    @Input() word: Word;
    @Input() language: Language;

    @Output() editWord: EventEmitter<Word> = new EventEmitter<Word>();

    public ngOnInit(): void {
        Object.keys(this.word.elements)
    }

    onEditWord(): void {
        this.editWord.emit(this.word);
    }
}