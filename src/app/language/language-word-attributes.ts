import { Word } from "../lexicon/word";

/*
Describes syntactic and other attributes about the word. Can be grouped by a supertype (e.g., ichidan and godan verbs both are types of verbs), allowing
a similar display experience between similar attributes. The primary use case is to display the abbreviated name during testing for context.
*/
export class WordAttribute {
    id: number;
    name: string;
    abbr: string;
    superType: WordAttribute | null;

    constructor(id: number, name: string, abbr: string, superType: WordAttribute | null) {
        this.id = id;
        this.name = name;
        this.abbr = abbr;
        this.superType = superType;
    }

    static GetWordAttributeFromAbbr(abbr: string) : WordAttribute {
        let definedAttribute = DefinedAttributesByAbbr.get(abbr);
        if (definedAttribute != undefined) {
            return definedAttribute;
        }

        return new WordAttribute(0, "", abbr, null);
    }
}

export const Noun = new WordAttribute(1, "Noun", "n", null);

export const Verb = new WordAttribute(10, "Verb", "v", null);
export const SuruVerb = new WordAttribute(11, "Suru Verb", "vs", Verb);

export const DefinedAttributesByAbbr: Map<string, WordAttribute> = new Map<string, WordAttribute>([
    [ Noun.abbr, Noun],

    [ Verb.abbr, Verb],
    [ SuruVerb.abbr, SuruVerb ]
]);




