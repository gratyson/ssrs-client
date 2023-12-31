import { TestRelation } from "../language/language-test-relation";

export class ReviewMode {
    TestRelation: TestRelation;
    ReviewType: ReviewType;
    MultipleChoiceOptionCount: number = 0;
}

export enum ReviewType {
    Summary,
    TypingTest,
    MultipleChoiceTest,
}