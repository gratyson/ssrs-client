import { UUID } from "../util/uuid";
import { Language } from "../language/language";
import { Word } from "./word";
import { User } from "../user/user";

export class Lexicon {
    ID: UUID;
    Owner: User;
    Title: string;
    Language: Language;
    Description: string;
    WordsIds: UUID[];

    constructor(id: UUID, owner: User, title: string, language: Language, description: string, wordIds: Iterable<UUID>) {
        this.ID = id;
        this.Owner = owner;
        this.Title = title;
        this.Language = language;
        this.Description = description;

        this.WordsIds = [];
        for(let wordId of wordIds) {
            this.WordsIds.concat(wordId);
        }
    }
}