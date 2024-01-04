import { Duration } from "../../util/duration/duration";

export class LexiconMetadata {
    readonly id: string;
    readonly owner: number;
    readonly title: string;
    readonly languageId: number;
    readonly description: string;
    readonly imageFileName: string;

    constructor(id: string, owner: number, title: string, languageId: number, description: string, imageFileName: string) {
        this.id = id;
        this.owner = owner;
        this.title = title;
        this.languageId = languageId;
        this.description = description;
        this.imageFileName = imageFileName;
    }
    
}

export class Lexicon extends LexiconMetadata {

    readonly wordIds: string[];

    constructor(id: string, owner: number, title: string, languageId: number, description: string, imageFileName: string, wordIds: Iterable<string>) {
        super(id, owner, title, languageId, description, imageFileName);
        this.wordIds = [];
        for(let wordId of wordIds) {
            this.wordIds.concat(wordId);
        }
    }

    public static getBlankLexicon(): Lexicon {
        return new Lexicon("", 0, "", 1, "", "", []);
    } 
}

export interface LexiconMetadataAndScheduledCounts {
    lexiconMetadata: LexiconMetadata;
    scheduledReviewCounts: { [k:string]: number };
    hasWordsToLearn: boolean;
}

export interface LexiconReviewHistory {
    lexiconId: string;
    wordId: string;
    learned: boolean;
    mostRecentTestTime: Date;
    nextTestRelationId: string;
    currentTestDelay: Duration;
    nextTestTime: Date;
    currentBoost: number;
    currentBoostExpirationDelay: Duration;
    testHistory: { [k:string]: TestHistory };
}

export const EMPTY_LEXICON_REVIEW_HISTORY = {
    lexiconId: "",
    wordId: "",
    learned: false,
    mostRecentTestTime: new Date(0),
    nextTestRelationId: "",
    currentTestDelay: Duration.fromMillis(0),
    nextTestTime: new Date(0),
    currentBoost: 0,
    currentBoostExpirationDelay: Duration.fromMillis(0),
    testHistory: {}
}

export interface TestHistory {
    totalTests: number;
    correct: number;
    correctStreak: number;
}

export interface FutureReviewEvent {
    lexiconId: string,
    wordId: string,
    reviewInstant: Date,
    inferred: boolean,
}

export interface LexiconReviewSummary {
    totalWords: number;
    learnedWords: number;
    futureReviewEvents: FutureReviewEvent[];
}