const SECONDS_MULT: number = 1000;
const MINUTES_MULT: number = 60000;
const HOURS_MULT: number = 3600000;
const DAYS_MULT: number = 86400000;

export class Duration {

    private millis: number;

    private constructor(millis: number) {
        this.millis = millis;
    }

    public static fromMillis(millis: number): Duration {
        return new Duration(millis);
    }

    public static fromSeconds(seconds: number, millis: number = 0): Duration {
        return new Duration((seconds * SECONDS_MULT) + millis);
    }
    
    public static fromMinutes(minutes: number, seconds: number = 0, millis: number = 0): Duration {
        return new Duration((minutes * MINUTES_MULT) + (seconds * SECONDS_MULT) + millis);
    }

    public static fromHours(hours: number, minutes: number = 0, seconds: number = 0, millis: number = 0): Duration {
        return new Duration((hours * HOURS_MULT) + (minutes * MINUTES_MULT) + (seconds * SECONDS_MULT) + millis);
    }

    public static fromDays(days: number, hours: number = 0, minutes: number = 0, seconds: number = 0, millis: number = 0): Duration {
        return new Duration((days * DAYS_MULT) + (hours * HOURS_MULT) + (minutes * MINUTES_MULT) + (seconds * SECONDS_MULT) + millis);
    }

    public toMillis(): number {
        return this.millis;
    }

    public toMillisPart(): number {
        return this.millis % SECONDS_MULT;
    }

    public toSeconds(): number {
        return this.millis / SECONDS_MULT;
    }

    public toSecondsPart(): number {
        return Math.floor((this.millis % MINUTES_MULT) / SECONDS_MULT) ;
    }

    public toMinutes(): number {
        return this.millis / MINUTES_MULT;
    }

    public toMinutesPart(): number {
        return Math.floor((this.millis % HOURS_MULT) / MINUTES_MULT);
    }

    public toHours(): number {
        return this.millis / HOURS_MULT;
    }

    public toHoursPart(): number {
        return Math.floor((this.millis % DAYS_MULT) / HOURS_MULT);
    }

    public toDays(): number {
        return this.millis / DAYS_MULT;
    }

    public toDaysPart(): number {
        return Math.floor(this.millis / DAYS_MULT);
    }

    public valueOf(): number {
        return this.millis;
    }
}