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
    overviewElements: WordElement[];
    allTestRelationships: TestRelationship[];
}

export interface WordElement {
    id: string;
    name: string;
    abbreviation: string;
    description: string;
    weight: number;
    applyLanguageFont: boolean;
    testTimeMultiplier: number;
    validationRegex: string | null;
}

export interface TestRelationship {
    id: string;
    displayName: string;
    testOn: WordElement;
    promptWith: WordElement;
    showAfterTest: WordElement;
    fallback: TestRelationship | null;
}