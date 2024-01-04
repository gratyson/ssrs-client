
export interface Language {
    id: number;
    displayName: string;
    fontName: string;
    audioFileRegex: string;
    testsToDouble: number;
    validElements: WordElement[];
    requiredElements: WordElement[];
    coreElements: WordElement[];
    dedupeElements: WordElement[];
    testRelationships: TestRelationship[];
}

export interface WordElement {
    id: string;
    name: string;
    abbreviation: string;
    weight: number;
    applyLanguageFont: boolean;
    testTimeMultiplier: number;
}

export interface TestRelationship {
    id: string;
    displayName: string;
    testOn: string;
    promptWith: string;
    showAfterTest: string;
    fallbackId: string;
    isReviewRelationship: boolean;
}