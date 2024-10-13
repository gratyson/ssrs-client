export class ReviewMode {
    
    // THIS MUST BE THE FIRST LINE -- the index gets populated in the constructor, so it must be declared before any of the static enum-eqse value call the constructor
    private static codeIndex: { [k: number]: ReviewMode} = {}; 

    public static readonly WordOverview: ReviewMode = new ReviewMode(0, false, false, true);
    public static readonly TypingTest: ReviewMode = new ReviewMode(1, true, false, false);
    public static readonly MultipleChoiceTest: ReviewMode = new ReviewMode(2, false, true, false);
    public static readonly WordOverviewWithTyping: ReviewMode = new ReviewMode(3, true, false, true);
    public static readonly WordOverviewReminder: ReviewMode = new ReviewMode(4, false, false, true);

    public static fromCode(code: number): ReviewMode {        
        return ReviewMode.codeIndex[code];
    }

    private code: number;
    private typingTest: boolean;
    private multipleChoiceTest: boolean;
    private overview: boolean;

    private constructor(code: number, typingTest: boolean, multipleChoiceTest: boolean, overview: boolean) {
        this.code = code;
        this.typingTest = typingTest;
        this.multipleChoiceTest = multipleChoiceTest;
        this.overview = overview;

        ReviewMode.codeIndex[code] = this;
    }

    public getCode(): number {
        return this.code;
    }

    public isTypingTest(): boolean {
        return this.typingTest;
    }

    public isMultpleChoiceTest(): boolean {
        return this.multipleChoiceTest;
    }

    public isTest(): boolean {
        return this.typingTest || this.multipleChoiceTest;
    }

    public isOverview(): boolean {
        return this.overview;
    }
}
