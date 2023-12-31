import { UUID } from "../util/uuid";
import { Word } from "../lexicon/word";
import { User } from "../user/user";
import { Kana, Meaning, Kanji, AdditionalKanji, LanguageElement } from "../language/language-element";
import { Noun, SuruVerb } from "../language/language-word-attributes";

const TEST_WORD_1 = new Word(UUID.FromString("888d63b2-b8a8-459a-8664-bc36273cdcf1"), { ID: 1 }, new Map<LanguageElement, string>([
    [Kana, "おいそれと"],
    [Meaning, "at a moment's notice; readily​​"],
]),[
    Noun
]);
const TEST_WORD_2 = new Word(UUID.FromString("888d63b2-b8a8-459a-8664-bc36273cdcf1"), { ID: 1 }, new Map<LanguageElement, string>([
    [Kana, "てきざい"],
    [Meaning, "man fit for the post; right person; stuff​​"],
    [Kanji, "適材"],
]),[
    Noun,
    SuruVerb
]);

export class WordDao {

    LoadWord(id: UUID): Word | null {
        if (id === TEST_WORD_1.ID) {
            return TEST_WORD_1;
        }
        if (id === TEST_WORD_2.ID) {
            return TEST_WORD_2;
        }
        return null;
    }
}