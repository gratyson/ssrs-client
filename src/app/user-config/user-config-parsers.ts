import { Duration } from "../util/duration/duration";

export class SettingParser<T> {

    public parseSettingValue(value: string): T | null {
        return null;
    }

    public settingValueToString(settingValue: T): string {
        return "";
    }

    public rightAlign(): boolean {
        return false;
    }

    public parseErrorMsg(): string {
        return "Invalid value";
    }
}

export class IntegerSettingParser extends SettingParser<number> {

    private readonly minValue: number;
    private readonly maxValue: number;
    
    public constructor(minValue: number, maxValue: number) {
        super();

        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    public override parseSettingValue(value: string): number | null {
        const numericValue = Number.parseInt(value);
        if (Number.isInteger(numericValue) && numericValue >= this.minValue && numericValue <= this.maxValue) {
            return numericValue;
        }

        return null;
    }

    public override settingValueToString(settingValue: number): string {
        return settingValue.toString();
    }

    public override rightAlign(): boolean {
        return true;
    }
}

export class BooleanSettingParser extends SettingParser<boolean> {
    public override parseSettingValue(value: string): boolean | null {
        if (value === "true") {
            return true;
        }

        if (value === "false") {
            return false;
        }

        return null;
    }

    public override settingValueToString(settingValue: boolean): string {
        return settingValue ? "true" : "false";
    }
}

export class HoursDurationSettingParser extends SettingParser<Duration> {
    private readonly minHours: number;
    private readonly maxHours: number;
    
    constructor(minHours: number, maxHours: number) {
        super();

        this.minHours = minHours;
        this.maxHours = maxHours;
    }

    override parseSettingValue(value: string): Duration | null {
        const hours = Number.parseInt(value);
        if (hours && hours >= this.minHours && hours <= this.maxHours) {
            return Duration.fromHours(hours);
        }

        return null;
    }

    override settingValueToString(settingValue: Duration): string {
        return settingValue.toHours().toString();
    }

    public override rightAlign(): boolean {
        return true;
    }
}