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
    testOn: string;
    promptWith: string;
    showAfterTest: string;

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

/*
export enum ReviewMode {
    WordOverview = 0,
    TypingTest = 1, 
    MultipleChoiceTest = 2,
    WordOverviewWithTyping = 3,
    WordOverviewReminder = 4,
}
*/

export interface ReviewTestResult {
    isCorrect: boolean;
    isNearMiss: boolean;
}

export interface ReviewEvent {
    scheduledEventId: string;
    lexiconId: string;
    wordId: string;
    
    reviewMode: ReviewMode;
    reviewType: ReviewType;
    testOn: string;
    promptWith: string;

    isCorrect: boolean;
    isNearMiss: boolean;
    elapsedTimeMs: number;

    override: boolean;
}