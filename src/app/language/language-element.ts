// Generic language elements
export const Meaning: LanguageElement = { ID: 0, ElementName: "Meaning" };

// Japanese language elements
export const Kana: LanguageElement = { ID: 100, ElementName: "Kana" };
export const Kanji: LanguageElement = { ID: 101, ElementName: "Kanji" };
export const AdditionalKanji: LanguageElement = { ID: 102, ElementName: "Additional Kanji" };

export class LanguageElement {
    ID: number;
    ElementName: String;
}