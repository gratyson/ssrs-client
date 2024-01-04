import { Duration } from "./duration";

describe("DurationTests", () => {
    it("fromMillis creates duration", () => {
        const duration: Duration = Duration.fromMillis(1234);

        expect(duration.toMillis()).toBe(1234);
    });

    it("fromSeconds creates duration", () => {
        let duration: Duration;
        
        duration = Duration.fromSeconds(55);
        expect(duration.toMillis()).toBe(55000);

        duration = Duration.fromSeconds(55, 55);
        expect(duration.toMillis()).toBe(55055);
    });

    it("fromMinutes creates duration", () => {
        let duration: Duration;
        
        duration = Duration.fromMinutes(3);
        expect(duration.toMillis()).toBe(180000);
        
        duration = Duration.fromMinutes(3, 3);
        expect(duration.toMillis()).toBe(183000);
        
        duration = Duration.fromMinutes(3, 3, 3);
        expect(duration.toMillis()).toBe(183003);
    });

    it("fromHours creates duration", () => {
        let duration: Duration;
        
        duration = Duration.fromHours(2);
        expect(duration.toMillis()).toBe(7200000);

        duration = Duration.fromHours(2, 2);
        expect(duration.toMillis()).toBe(7320000);

        duration = Duration.fromHours(2, 2, 2);
        expect(duration.toMillis()).toBe(7322000);

        duration = Duration.fromHours(2, 2, 2, 2);
        expect(duration.toMillis()).toBe(7322002);
    });

    it("fromDays creates duration", () => {
        let duration: Duration;
        
        duration = Duration.fromDays(5);
        expect(duration.toMillis()).toBe(432000000);
        expect(duration.toDays()).toBe(5);
    
        duration = Duration.fromDays(5, 5);
        expect(duration.toMillis()).toBe(450000000);
        expect(duration.toDays().toFixed(2)).toBe("5.21");

        duration = Duration.fromDays(5, 5, 5);
        expect(duration.toMillis()).toBe(450300000);
        expect(duration.toDays().toFixed(2)).toBe("5.21");

        duration = Duration.fromDays(5, 5, 5, 5);
        expect(duration.toMillis()).toBe(450305000);
        expect(duration.toDays().toFixed(2)).toBe("5.21");

        duration = Duration.fromDays(5, 5, 5, 5, 5);
        expect(duration.toMillis()).toBe(450305005);
        expect(duration.toDays().toFixed(2)).toBe("5.21");
    });

    it("part functions parse values correctly", () => {
        const duration: Duration = Duration.fromMillis(450305005);

        expect(duration.toDaysPart()).toBe(5);
        expect(duration.toHoursPart()).toBe(5);
        expect(duration.toMinutesPart()).toBe(5);
        expect(duration.toSecondsPart()).toBe(5);
        expect(duration.toMillisPart()).toBe(5);
    });
});