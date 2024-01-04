import { Word } from "../../lexicon/model/word";
import { ReviewMode, ReviewTestResult, WordReview } from "../model/review-session";

export class ReviewQueueManager {
    
    private wordReviewItemQueues: WordReviewQueueItem[][];
    private wordReviewResults: WordReviewResult[]; 
    
    private totalTests: number;
    private completedTests: number;

    private currentReviewItemIndex: number;
    private queuesIntroduced: number;
    private queueIntroductionBatchSize: number;
    private testsBetweenQueueIntroduction: number;
    private correctTestsSinceLastQueueIntroduction: number;

    public constructor(reviewQueues: WordReview[][], queueIntroductionBatchSize: number = 0, testsBetweenQueueIntroduction: number = 0) {
        this.totalTests = 0;
        this.completedTests = 0;
        
        this.wordReviewItemQueues = [];
        this.wordReviewResults = [];

        reviewQueues.forEach(reviewQueue => {
            let wordReviewQueue: WordReviewQueueItem[] = []
            reviewQueue.forEach(wordReview => {
                if (this.recordProgress(wordReview)) {
                    this.totalTests++;
                }
                wordReviewQueue.push({ wordReview: wordReview, requeueCount: 0, totalTime: 0, retest: false })
            })
            this.wordReviewItemQueues.push(wordReviewQueue);
        });

        this.currentReviewItemIndex = -1;
        this.queueIntroductionBatchSize = queueIntroductionBatchSize;
        this.testsBetweenQueueIntroduction = testsBetweenQueueIntroduction;
        this.correctTestsSinceLastQueueIntroduction = 0;

        this.queuesIntroduced = queueIntroductionBatchSize > 0 ? 0 : reviewQueues.length;
    }

    public isEmpty(): boolean {
        for (let wordReviewItemQueue of this.wordReviewItemQueues) {
            if (wordReviewItemQueue.length > 0) {
                return false;
            }
        }
        return true;
    }

    public getProgess(): ReviewProgress {
        return { totalTests: this.totalTests, completedTests: this.completedTests };
    }

    public getTotalTimeSoFar(): number {
        if (this.wordReviewItemQueues.length > 0 && this.currentReviewItemIndex >= 0 
            && this.wordReviewItemQueues[this.currentReviewItemIndex].length > 0 && this.wordReviewItemQueues[this.currentReviewItemIndex][0].totalTime) {
            return this.wordReviewItemQueues[this.currentReviewItemIndex][0].totalTime; 
        }

        return 0;
    }

    public getCurrent(): WordReview | null {
        if (this.wordReviewItemQueues.length > 0 && this.currentReviewItemIndex >= 0 && this.wordReviewItemQueues[this.currentReviewItemIndex].length > 0) {
            return this.wordReviewItemQueues[this.currentReviewItemIndex][0].wordReview;
        }

        return this.getNextWordReview();
    }

    public deferAndGetNext(testTime: number): WordReview | null {
        if (this.wordReviewItemQueues.length > 0 && this.currentReviewItemIndex >= 0 && this.wordReviewItemQueues[this.currentReviewItemIndex].length > 0) {
            this.wordReviewItemQueues[this.currentReviewItemIndex][0].totalTime += testTime;
            this.wordReviewItemQueues[this.currentReviewItemIndex][0].requeueCount++;
        }

        return this.getNextWordReview();
    }

    public markCorrectAndGetNext(testTime: number, isNearMiss: boolean): WordReview | null {
        this.correctTestsSinceLastQueueIntroduction++;
        this.saveReviewResult(testTime, true, isNearMiss);
        this.wordReviewItemQueues[this.currentReviewItemIndex].shift();
        
        return this.getNextWordReview();
    }

    public markIncorrectAndGetNext(testTime: number, isNearMiss: boolean, overviewReview: WordReview | null = null): WordReview | null {
        this.saveReviewResult(testTime, false, isNearMiss);

        this.wordReviewItemQueues[this.currentReviewItemIndex][0].retest = true;
        this.wordReviewItemQueues[this.currentReviewItemIndex][0].totalTime = 0;
        if (overviewReview !== null) {
            if (overviewReview.recordResult) {
                this.totalTests++;
            }
            this.wordReviewItemQueues[this.currentReviewItemIndex].unshift({ wordReview: overviewReview, requeueCount: 0, totalTime: 0, retest: false })
            return this.wordReviewItemQueues[this.currentReviewItemIndex][0].wordReview;
        }

        return this.getNextWordReview();
    }

    public getProcessedItems(): WordReviewResult[] {
        return this.wordReviewResults;
    }

    public updateWord(newWord: Word): void {
        for (let wordReviewItemQueue of this.wordReviewItemQueues) {
            for (let wordReviewItem of wordReviewItemQueue) {
                if (wordReviewItem.wordReview?.word?.id === newWord.id) {
                    wordReviewItem.wordReview.word = newWord;
                }
            }
        }
    }

    private getNextWordReview(): WordReview | null {
        this.currentReviewItemIndex = this.selectNextQueue();
        
        if (this.currentReviewItemIndex >= 0) {
            return this.wordReviewItemQueues[this.currentReviewItemIndex][0].wordReview;
        }

        return null;
    }

    private selectNextQueue(): number {    
        if (this.introduceNewQueue()) {
            this.correctTestsSinceLastQueueIntroduction = 0;
            return this.queuesIntroduced++;
        }

        if (!this.wordReviewItemQueues || this.wordReviewItemQueues.length === 0) {
            return -1;
        }
        
        let totalWeight: number = 0;
        for(let queueNum = 0; queueNum < this.queuesIntroduced; queueNum++) {
            if (queueNum != this.currentReviewItemIndex) {{
                totalWeight += this.wordReviewItemQueues[queueNum].length;
            }}
        }

        if(totalWeight === 0) {  // All other queues are empty. Use current queue if there are more items, otherwise there's nothing left to do
            if (this.wordReviewItemQueues[this.currentReviewItemIndex].length > 0) {
                return this.currentReviewItemIndex;
            }

            return -1;
        }

        let queueSelectValue: number = Math.floor(Math.random() * totalWeight) + 1;
        for(let queueNum = 0; queueNum < this.queuesIntroduced; queueNum++) {
            if (queueNum != this.currentReviewItemIndex) {{
                queueSelectValue -= this.wordReviewItemQueues[queueNum].length;
                if (queueSelectValue <= 0) {
                    return queueNum;
                }
            }}
        }

        // The above loop should always select a queue, so this code should be unreachable.
        console.error("Failed to select next review queue");
        return 0;
    }

    private introduceNewQueue(): boolean {
        if (this.queuesIntroduced >= this.wordReviewItemQueues.length) {  // all queues introduced
            return false;
        }        

        let hasAtLeastOneTest: boolean = false;
        for(let queueIndex = 0; queueIndex < this.queuesIntroduced; queueIndex++) {
            if (this.wordReviewItemQueues[queueIndex].length > 0) {
                hasAtLeastOneTest = true;
                break;
            }
        }

        return !hasAtLeastOneTest
               || (this.queuesIntroduced % this.queueIntroductionBatchSize !== 0) 
               || (this.correctTestsSinceLastQueueIntroduction > this.testsBetweenQueueIntroduction);
    }

    private saveReviewResult(testTime: number, isCorrect: boolean, isNearMiss: boolean): void {
        if (this.wordReviewItemQueues.length > 0 && this.currentReviewItemIndex >= 0 && this.wordReviewItemQueues[this.currentReviewItemIndex].length > 0) {
            const currentQueueItem: WordReviewQueueItem = this.wordReviewItemQueues[this.currentReviewItemIndex][0];
            
            if (isCorrect && this.recordProgress(currentQueueItem.wordReview)) {
                this.completedTests++;
            }

            if (currentQueueItem.wordReview.recordResult) {
                if (!currentQueueItem.retest) {
                    this.wordReviewResults.push({ 
                        wordReview: currentQueueItem.wordReview, 
                        requeueCount: currentQueueItem.requeueCount,
                        totalTime: currentQueueItem.totalTime + testTime,
                        reviewTestResult: { isCorrect: isCorrect, isNearMiss: isNearMiss },
                        reviewTestResultOverride: null
                    });
                }
            }
        }
    }

    private recordProgress(wordReview: WordReview): boolean {
        return wordReview.reviewMode !== ReviewMode.WordOverview
            && wordReview.reviewMode !== ReviewMode.WordOverviewReminder
            && wordReview.reviewMode !== ReviewMode.WordOverviewWithTyping;
    }
}

interface WordReviewQueueItem {
    wordReview: WordReview;
    requeueCount: number;
    totalTime: number;
    retest: boolean;
}

export interface WordReviewResult {
    wordReview: WordReview;
    requeueCount: number;
    totalTime: number;
    reviewTestResult: ReviewTestResult;
    reviewTestResultOverride: ReviewTestResult | null;
}

export interface ReviewProgress {
    totalTests: number;
    completedTests: number;
}
