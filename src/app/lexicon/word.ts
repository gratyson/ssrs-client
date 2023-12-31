import { UUID } from "../util/uuid";
import { LanguageElement } from "../language/language-element";
import { WordAttribute } from "../language/language-word-attributes";
import { User } from "../user/user";

export class Word {
    ID: UUID;
    Owner: User;
    Elements: Map<LanguageElement, string>;
    Attributes: WordAttribute[];

    constructor(id: UUID, owner: User, elements: Map<LanguageElement, string>, attributes: WordAttribute[]) {
        this.ID = id;
        this.Owner = owner;
        this.Elements = elements;
        this.Attributes = attributes;
    }
}