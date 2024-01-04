import { Duration } from "../util/duration/duration";
import { BooleanSettingParser, HoursDurationSettingParser, IntegerSettingParser, SettingParser } from "./user-config-parsers";

export class UserConfigSetting<T> {
    readonly name: string;
    readonly displayName: string;
    readonly persist: boolean;
    readonly defaultValue: T;
    readonly parser: SettingParser<T>

    public constructor(name: string, displayName: string, persist: boolean, defaultValue: T, parser: SettingParser<T>) {
        this.name = name;
        this.displayName = displayName;
        this.persist = persist;
        this.defaultValue = defaultValue;
        this.parser = parser;
    }
}

// ****
// Persisted Settings - Saved on server, editable by user. Add to EDITABLE_SETTINGS when creating a new setting
// ****
export const WordsToLearnCount: UserConfigSetting<number> = new UserConfigSetting<number>(
    "WordsToLearnCount",
    "Number of words to learn per learning session",
    true,
    10,
    new IntegerSettingParser(0, 50));

export const WordsToLearnIntroductionBatchSize: UserConfigSetting<number> = new UserConfigSetting<number>(
    "WordsToLearnIntroductionBatchSize",
    "Number of words introduced together during a learning session",
    true,
    3,
    new IntegerSettingParser(1, 10));

export const WordsToLearnTestsBetweenIntroduction: UserConfigSetting<number> = new UserConfigSetting<number>(
    "WordsToLearnTestsBetweenIntroduction",
    "Number of tests between introducing new words during a learning session",
    true,
    9,
    new IntegerSettingParser(1, 50));

export const MaxWordsToReviewPerSession: UserConfigSetting<number> = new UserConfigSetting<number>(
    "MaxWordsToReviewPerSession",
    "Maximum words to review each review session (0 = max allowed value)",
    true,
    0,
    new IntegerSettingParser(0, 999));

export const InitialTestDelay: UserConfigSetting<Duration> = new UserConfigSetting<Duration>(
    "InitialTestDelay",
    "Initial delay after learning words (hours)",
    true,
    Duration.fromHours(4),
    new HoursDurationSettingParser(1, 24));

export const LexiconSummaryGraphDayCount: UserConfigSetting<number> = new UserConfigSetting<number>(
    "LexiconSummaryGraphDayCount",
    "Number of days shown in the future lexicon review summary future review graph",
    true,
    30,
    new IntegerSettingParser(1, 180));

export const EDITABLE_SETTINGS: UserConfigSetting<number | Duration>[] = [
    WordsToLearnCount,
    WordsToLearnIntroductionBatchSize,
    WordsToLearnTestsBetweenIntroduction,
    MaxWordsToReviewPerSession,
    InitialTestDelay,
    LexiconSummaryGraphDayCount,
];


// ****
// Non-persisted Settings - Not saved on server or local memory, discarded when user closes or refreshes tab
// ****
export const ReviewTodaysWordsEarly: UserConfigSetting<boolean> = new UserConfigSetting<boolean>(
    "ReviewTodaysWordsEarly",
    "Review Today's Words Early",
    false,
    false,
    new BooleanSettingParser()
)