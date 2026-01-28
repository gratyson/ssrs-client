import { TestRelationship } from "../../language/language";
import { Word } from "../../lexicon/model/word";
import { ReviewMode } from "./review-mode";

export class ReviewSession {    
    readonly reviewType: ReviewType
    readonly wordsToReview: WordReview[];
}

export interface WordReview {
    languageId: number;
    word: Word;
    scheduledEventId: string;
    testRelationship: TestRelationship | null;

    reviewMode: ReviewMode;
    reviewType: ReviewType;
    recordResult: boolean;

    allowedTimeSec: number;

    typingTestButtons: string[];
    multipleChoiceButtons: string[];
}

export enum ReviewType {
    Review = 0,
    Learn = 1,
}

export interface ReviewTestResult {
    isCorrect: boolean;
    isNearMiss: boolean;
}

export interface ReviewEvent {
    scheduledEventId: string | null;
    lexiconId: string;
    wordId: string;
    
    reviewMode: ReviewMode;
    reviewType: ReviewType;
    testRelationship: TestRelationship | null;

    isCorrect: boolean;
    isNearMiss: boolean;
    elapsedTimeMs: number;

    override: boolean;
}