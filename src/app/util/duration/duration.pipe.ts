import { Pipe, PipeTransform } from "@angular/core";
import { Duration } from "./duration";

@Pipe({
    name: "duration",
    standalone: true
})
export class DurationPipe implements PipeTransform {
    transform(value: Duration | number): string {
        let duration: Duration;
        if (typeof(value) === "number") {
            duration = Duration.fromMillis(value);
        } else {
            duration = value;
        }
        
        let output: string = "";

        const days = duration.toDaysPart();
        if (days > 0) {
            output += `${days} ${days === 1 ? 'day' : 'days'}, `;
        }

        const hours = duration.toHoursPart();
        if (output || hours > 0) {
            output += `${hours} ${hours === 1 ? 'hour' : 'hours'}, `;
        }

        const minutes = duration.toMinutesPart();
        if (output || minutes > 0) {
            output += `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}, `;
        }

        const seconds = duration.toSecondsPart();
        output += `${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;

        return output;
    }

}