import { Component, inject } from "@angular/core";
import { LexiconDao } from "../../dao/dao-lexicon";
import { WordDao } from "../../dao/dao-word";
import { Lexicon } from "../lexicon";

@Component({
    selector: "lexicon-edit",
    template: `
    `,
    standalone: true
})
export class LexiconEdit {
    private lexiconDao = inject(LexiconDao);
    private wordDao = inject(WordDao);

    lexicon: Lexicon;

    constructor(lexicon: Lexicon) {
        this.lexicon = lexicon;
    }
}