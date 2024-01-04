import { ReviewMode, ReviewType, WordReview } from "../model/review-session";
import { ReviewProgress, ReviewQueueManager, WordReviewResult } from "./review-queue-manager";


describe("ReviewQueueManagerTests", () => {
    let reviewQueueManager: ReviewQueueManager;
    let reviewQueues: WordReview[][];
    
    beforeEach(() => {
        reviewQueues = [];
        for(let wordIdx = 0; wordIdx < 4; wordIdx++) {
            let reviewQueue: WordReview[] = [];
            for (let wordCntIdx = 0; wordCntIdx <= wordIdx; wordCntIdx++) {
                reviewQueue.push(buildWordReview(wordIdx, wordCntIdx, [wordIdx]));
            }
            reviewQueues.push(reviewQueue)
            
        }

        reviewQueueManager = new ReviewQueueManager(reviewQueues);
    })

    it("empty queue is initialized", () => {
        reviewQueueManager = new ReviewQueueManager([]);

        expect(reviewQueueManager.isEmpty()).toBeTrue();
        expect(reviewQueueManager.getCurrent()).toBeNull();
    });

    it("all queue entries are processed", () => {
        testProcessAll(reviewQueueManager, true);
    });

    it("delaying records test time", async () => {
        reviewQueueManager = new ReviewQueueManager([reviewQueues[0]]); // only one queue

        const testTime: number = 500;
        
        reviewQueueManager.getCurrent();
        expect(reviewQueueManager.getTotalTimeSoFar()).toBe(0);

        reviewQueueManager.deferAndGetNext(testTime);
        expect(reviewQueueManager.getTotalTimeSoFar()).toBe(testTime);

        reviewQueueManager.deferAndGetNext(testTime);
        expect(reviewQueueManager.getTotalTimeSoFar()).toBe(testTime * 2);


    });

    it("isEmpty is false while tests exist", () => {
        let wordReview: WordReview | null = reviewQueueManager.getCurrent();
        while(wordReview !== null) { 
            expect(reviewQueueManager.isEmpty()).toBeFalse();
            wordReview = reviewQueueManager.markCorrectAndGetNext(100, false);
        }
        expect(reviewQueueManager.isEmpty()).toBeTrue();
    });

    it("no consecutive words unless other queues are exhausted (1/3)", () => {
        testQueueExhaustion(reviewQueueManager);
    });
    it("no consecutive words unless other queues are exhausted (2/3)", () => {
        testQueueExhaustion(reviewQueueManager);
    });
    it("no consecutive words unless other queues are exhausted (3/3)", () => {
        testQueueExhaustion(reviewQueueManager);
    });

    it("test deferAndGetNext", () => {
        let wordReview: WordReview | null = reviewQueueManager.getCurrent();
        expect(wordReview).not.toBe(null);
        let lastWordId: number = wordReview != null ? Number.parseInt(wordReview.word.id) : -1;

        for (let attempts = 0; attempts < 200; attempts++) {
            wordReview = reviewQueueManager.deferAndGetNext(10);
            expect(wordReview).not.toBe(null);
            const wordId = wordReview != null ? Number.parseInt(wordReview.word.id) : -1;
            expect(wordId).not.toBe(lastWordId);

            lastWordId = wordId;
        }

        // make sure all of the tests still are processed as expected after deferrment
        testProcessAll(reviewQueueManager, false);

        const results: WordReviewResult[] = reviewQueueManager.getProcessedItems();
        expect(results.length).toBe(4);
        for(let result of results) {
            const wordId = result.wordReview.word.id;
            if (wordId === "0") {
                // the first word gets deferred and the last word gets recorded, so only the queue with one item will have a requeue count greater than 0
                expect(result.requeueCount).toBeGreaterThan(0);
            } else {
                expect(result.requeueCount).toBe(0);
            }
        }
    });

    it("test markIncorrectAndGetNext", () => {
        const expectedTestOn = [ [ "e1" ], [ "e1" , "e2" ], [ "e1", "e2", "e3" ], [ "e1", "e2", "e3", "e1" ] ];
        const failedFirstTest: boolean[] = [ false, false, false, false ];
        let correctProcessedCnt: number = 0;
        let incorrectProcessedCnt: number = 0;
        let overviewCnt: number = 0;        

        let wordReview: WordReview | null = reviewQueueManager.getCurrent();
        while(wordReview !== null) {
            const wordId: number = Number.parseInt(wordReview.word.id);

            if (failedFirstTest[wordId] && wordReview.testOn === "") {
                overviewCnt++;
                wordReview = reviewQueueManager.markCorrectAndGetNext(10, false);
            } else {
                expect(wordReview.testOn).toBe(expectedTestOn[wordId][0]);

                if (failedFirstTest[wordId]) {
                    expectedTestOn[wordId].shift();
                    failedFirstTest[wordId] = false;
                    wordReview = reviewQueueManager.markCorrectAndGetNext(100, false);
                    correctProcessedCnt++;
                } else {
                    failedFirstTest[wordId] = true;
                    wordReview = reviewQueueManager.markIncorrectAndGetNext(100, wordId % 2 === 0, buildWordReview(wordId, -1));
                    incorrectProcessedCnt++;
                }
            }
        }

        expect(correctProcessedCnt).toBe(10);
        expect(incorrectProcessedCnt).toBe(10);
        expect(overviewCnt).toBe(10);

        const results: WordReviewResult[] = reviewQueueManager.getProcessedItems();
        expect(results.length).toBe(4);
        for(let result of results) {
            const wordId = Number.parseInt(result.wordReview.word.id);
            
            expect(result.wordReview.word.id).toBe(`${wordId}`);
            expect(result.wordReview.testOn).toBe(`e${(wordId) % 3 + 1}`);
            expect(result.requeueCount).toBe(0);
            expect(result.totalTime).toBe(100);
            expect(result.reviewTestResult.isCorrect).toBeFalse();
            expect(result.reviewTestResult.isNearMiss).toBe(wordId % 2 === 0);
        }
    });

    it("Queues are introduced as expected when introduction batch size is set", () => {
        let reviewQueueManager = new ReviewQueueManager(reviewQueues, 2, 2);
        const expectedTestOn = [ [ "e1" ], [ "e1" , "e2" ], [ "e1", "e2", "e3" ], [ "e1", "e2", "e3", "e1" ] ];
        let completedCnt: number = 0;

        let wordReview: WordReview | null = reviewQueueManager.getCurrent();
        while(wordReview !== null) {
            const wordId: number = Number.parseInt(wordReview.word.id);

            expect(wordReview.testOn).toBe(expectedTestOn[wordId][0]);
            expectedTestOn[wordId].shift();

            // Expect the first entry of the first two queues to be introduced in order,
            // followed by the only available entry (second entry of the second queue), 
            // followed by the introduction of the final two queues.
            if (completedCnt == 0) {
                expect(wordId).toBe(0);
                expect(wordReview.testOn).toBe("e1");
            } else if (completedCnt == 1) {
                expect(wordId).toBe(1);
                expect(wordReview.testOn).toBe("e1");
            } else if (completedCnt == 2) {
                expect(wordId).toBe(1);
                expect(wordReview.testOn).toBe("e2");
            } else if (completedCnt == 3) {
                expect(wordId).toBe(2);
                expect(wordReview.testOn).toBe("e1");
            } else if (completedCnt == 4) {
                expect(wordId).toBe(3);
                expect(wordReview.testOn).toBe("e1");                                                
            }
    
            completedCnt++;
            wordReview = reviewQueueManager.markCorrectAndGetNext(123, wordId % 2 === 0);

            
        }
    
        
        expectedTestOn.forEach(list => {
            expect(list.length).toBe(0);
        })
        

    });
});

function testQueueExhaustion(reviewQueueManager: ReviewQueueManager): void {
    let wordReview: WordReview | null = reviewQueueManager.getCurrent();
    let lastWordId: number = -1;
    let processedWordCount: number[] = [0, 0, 0];

    while(wordReview !== null) { 
        const wordId: number = Number.parseInt(wordReview.word.id);
        processedWordCount[wordId]++;

        let otherQueuesExhausted: boolean = true;
        for(let i = 0; i < 3; i++) {
            if (i !== wordId && processedWordCount[i] !== i + 1) {
                otherQueuesExhausted = false;
                break;
            }
        }

        // Only expect non-consecutive if other queues are exhausted
        if (!otherQueuesExhausted) {
            expect(wordId === lastWordId).toBeFalse();
        }

        lastWordId = wordId;
        wordReview = reviewQueueManager.markCorrectAndGetNext(100, false);
    }
}

function buildWordReview(wordId: number, wordOffset: number, wordOffsetsToRecord: number[] = []): WordReview {
    return {
        languageId: 0,
        word: { id: `${wordId}`, elements: { "e1": `w${wordId}e1`, "e2": `w${wordId}e2`, "e3": `w${wordId}e3`},  attributes: "n", audioFiles: [] },
        scheduledEventId: "eventId",
        testOn: wordOffset >= 0 ? `e${(0 + wordOffset) % 3 + 1}` : "",
        promptWith: wordOffset >= 0 ? `e${(1 + wordOffset) % 3 + 1}` : "",
        showAfterTest: wordOffset >= 0 ? `e${(2 + wordOffset) % 3 + 1}` : "none",

        reviewMode: ReviewMode.TypingTest,
        reviewType: ReviewType.Learn,
        recordResult: wordOffsetsToRecord.indexOf(wordOffset) >= 0,
    
        allowedTimeSec: 10,
    
        typingTestButtons: [..."we123"],
        multipleChoiceButtons: []
    }
}

function testProcessAll(reviewQueueManager: ReviewQueueManager, checkResults: boolean): void {
    const expectedTestOn = [ [ "e1" ], [ "e1" , "e2" ], [ "e1", "e2", "e3" ], [ "e1", "e2", "e3", "e1" ] ];
    let expectedCompleted: number = 0;    
    
    let wordReview: WordReview | null = reviewQueueManager.getCurrent();
    while(wordReview !== null) {
        const wordId: number = Number.parseInt(wordReview.word.id);

        expect(wordReview.testOn).toBe(expectedTestOn[wordId][0]);
        expectedTestOn[wordId].shift();

        expectedCompleted++;
        
        wordReview = reviewQueueManager.markCorrectAndGetNext(123, wordId % 2 === 0);

        const progress: ReviewProgress = reviewQueueManager.getProgess();
        expect(progress.totalTests).toBe(10);
        expect(progress.completedTests).toBe(expectedCompleted)
    }

    expectedTestOn.forEach(list => {
        expect(list.length).toBe(0);
    })

    if(checkResults) {
        const results: WordReviewResult[] = reviewQueueManager.getProcessedItems();
        expect(results.length).toBe(4);
        for(let result of results) {
            const wordId = Number.parseInt(result.wordReview.word.id);

            expect(result.wordReview.word.id).toBe(`${wordId}`);
            expect(result.wordReview.testOn).toBe(`e${(wordId) % 3 + 1}`);
            expect(result.requeueCount).toBe(0);
            expect(result.totalTime).toBe(123);
            expect(result.reviewTestResult.isCorrect).toBeTrue();
            expect(result.reviewTestResult.isNearMiss).toBe(wordId % 2 === 0);
        }
    }
}