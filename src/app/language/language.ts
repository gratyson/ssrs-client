import { ReviewMode, ReviewType  } from "../review/review-mode";
import { LanguageElement, Kana, Meaning, Kanji, AdditionalKanji } from "./language-element";
import { TestRelation } from "./language-test-relation";

export class Language {
    ID: number;
    DisplayName: string;
    Elements: LanguageElement[];
    RequiredElements: LanguageElement[];
    AudioFilePatterns: string[];
    RelationsToTest: TestRelation[];
    LearningSequence: ReviewMode[];
}

export const Japanese: Language = {
    ID: 1,
    DisplayName: "Japanese",
    Elements: [Kana, Meaning, Kanji, AdditionalKanji],
    RequiredElements: [Kana, Meaning],
    AudioFilePatterns: [""],
    RelationsToTest: [
        { PromptWith: Meaning, TestOn: Kana, ShowAfterTest: Kanji },
        { PromptWith: Meaning, TestOn: Kanji, ShowAfterTest: Kana },
        { PromptWith: Kanji, TestOn: Kana, ShowAfterTest: Meaning }
    ],
    LearningSequence: [
        { TestRelation: { PromptWith: Meaning, TestOn: Kana, ShowAfterTest: Kanji }, ReviewType: ReviewType.MultipleChoiceTest, MultipleChoiceOptionCount: 4 },
        { TestRelation: { PromptWith: Kana, TestOn: Meaning, ShowAfterTest: Kanji }, ReviewType: ReviewType.MultipleChoiceTest, MultipleChoiceOptionCount: 6 },
        { TestRelation: { PromptWith: Meaning, TestOn: Kana, ShowAfterTest: Kanji }, ReviewType: ReviewType.TypingTest, MultipleChoiceOptionCount: 0 },

        { TestRelation: { PromptWith: Meaning, TestOn: Kanji, ShowAfterTest: Kana }, ReviewType: ReviewType.MultipleChoiceTest, MultipleChoiceOptionCount: 4 },
        { TestRelation: { PromptWith: Kanji, TestOn: Meaning, ShowAfterTest: Kana }, ReviewType: ReviewType.MultipleChoiceTest, MultipleChoiceOptionCount: 6 },
        { TestRelation: { PromptWith: Meaning, TestOn: Kanji, ShowAfterTest: Kana }, ReviewType: ReviewType.TypingTest, MultipleChoiceOptionCount: 0 },

        { TestRelation: { PromptWith: Kanji, TestOn: Kana, ShowAfterTest: Meaning }, ReviewType: ReviewType.MultipleChoiceTest, MultipleChoiceOptionCount: 6 },
        { TestRelation: { PromptWith: Kana, TestOn: Kana, ShowAfterTest: Meaning }, ReviewType: ReviewType.MultipleChoiceTest, MultipleChoiceOptionCount: 8 },
        { TestRelation: { PromptWith: Kanji, TestOn: Kana, ShowAfterTest: Meaning }, ReviewType: ReviewType.TypingTest, MultipleChoiceOptionCount: 0 },

        { TestRelation: { PromptWith: Meaning, TestOn: Kana, ShowAfterTest: Kanji }, ReviewType: ReviewType.TypingTest, MultipleChoiceOptionCount: 0 },
        { TestRelation: { PromptWith: Meaning, TestOn: Kanji, ShowAfterTest: Kana }, ReviewType: ReviewType.TypingTest, MultipleChoiceOptionCount: 0 },
        { TestRelation: { PromptWith: Kanji, TestOn: Kana, ShowAfterTest: Meaning }, ReviewType: ReviewType.TypingTest, MultipleChoiceOptionCount: 0 },
        
    ],
}