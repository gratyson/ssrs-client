import { Component, Input, SimpleChanges } from "@angular/core";
import { MatChipsModule } from "@angular/material/chips";
import { ATTRIBUTE_CLASS_TABLE } from "../../model/color-config";

const ATTRIBUTE_SHARED_CLASS = "word-attribute-chip";
const ATTRIBUTE_DELIMITER = "|";

@Component({
    selector: "review-attributes",
    templateUrl: "review-attributes.html",
    styleUrl: "review-attributes.css",
    imports: [MatChipsModule]
})
export class ReviewAttributesComponent {

    @Input() attributes: string = "";

    attributeDisplay: AttributeDisplay[] = [];

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("attributes")) {
            this.attributeDisplay = this.parseAttributes(this.attributes);
        }
    }

    private parseAttributes(attributes: string): AttributeDisplay[] {
        let attributesToDisplay: AttributeDisplay[] = [];
        
        for (let attributeVal of attributes.split(ATTRIBUTE_DELIMITER)) {
            let elementClass: string = ATTRIBUTE_CLASS_TABLE[attributeVal]; 
            attributesToDisplay.push({ attributeName: attributeVal, attributeClass: `${ATTRIBUTE_SHARED_CLASS} ${elementClass}` });
        }

        return attributesToDisplay;
    }
}

interface AttributeDisplay {
    attributeName: string;
    attributeClass: string;
}

