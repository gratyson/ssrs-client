import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from "@angular/core";
import { Word } from "../../../../lexicon/model/word";
import { Language } from "../../../../language/language";
import { LanguagePronuncationGuide } from "../language-pronuncation-guide";

const KANA_ELEMENT: string = "kana";
const ACCENT_ELEMENT: string = "accent";
const SMALL_KANA: string = "ぁぃぅぇぉゃゅょァィゥェォャュョ";
enum AccentType {
    Heiban = 0,
    AtamaDaka = 1,
    NakaDaka = 2,
    ODaka = 3
}

const ACCENT_TYPE_COLOR_CLASS: { [k:number]: string } = {
    0: "border-color-primary-400",
    1: "border-color-accent-200",
    2: "border-color-accent-400",
    3: "border-color-accent-600"
}

const ACCENT_LINE_OVERFLOW_PX: number = 2;

@Component({
    selector: "japanese-pitch-accent-guide",
    templateUrl: "japanese-pitch-accent-guide.html",
    styleUrl: "japanese-pitch-accent-guide.css",
    standalone: true,
    imports: []
})
export class JapanesePitchAccentGuide extends LanguagePronuncationGuide {
    
    readonly BASE_LINE_WIDTH_EM: number = 0.09375;
    readonly eAccentType: typeof AccentType = AccentType;

    @Input() language: Language;
    @Input() word: Word;

    @Output() hasPronunciationGuide: EventEmitter<boolean> = new EventEmitter<boolean>();

    @ViewChild("risingInflectionDiv") risingInflectionLineDiv: ElementRef;
    @ViewChild("fallingInflectionDiv") fallingInflectionLineDiv: ElementRef;
    @ViewChild("accentDiv") accentLineDiv: ElementRef;

    languageFont: string = "";
    
    accentType: AccentType;
    accentLineColorClass: string = "";
    
    flatCharsUnderline: string = "";
    flatCharsOverline: string = "";

    risingInflectionChars: string = ""
    accentChar: string = "";
    fallingInflectionChars: string = "";

    risingInflectionTransform: string = "";
    accentTransform: string = "";
    fallingInflectionTransform: string = "";

    public ngOnChanges(simpleChanges: SimpleChanges): void {
        if (simpleChanges.hasOwnProperty("language")) {
            this.languageFont = this.language.fontName;
        } 
        if (simpleChanges.hasOwnProperty("word")) {
            this.processWord(this.word);
        }
    }

    private calculateInflectionTransform(elementRef: ElementRef, rising: boolean): string {
        if (elementRef && elementRef.nativeElement) {
            const width: number = elementRef.nativeElement.clientWidth;
            const height: number = elementRef.nativeElement.clientHeight;
            
            let rotation: number = Math.atan((height) / (width));
            if (rising) {
                rotation *= -1;
            }

            return `skewY(${rotation}rad) translateY(calc(${height / 2}px))`;
        }

        return "";
    }

    private calculateAccentTransform(elementRef: ElementRef): string {
        if (elementRef && elementRef.nativeElement) {
            const width: number = elementRef.nativeElement.clientWidth;
            const scalingFactor = (width + ACCENT_LINE_OVERFLOW_PX) / width;

            return `scaleX(${scalingFactor})`;
        }
        
        return "";
    }

    private processWord(word: Word) {
        this.flatCharsUnderline = "";
        this.flatCharsOverline = "";
    
        this.risingInflectionChars = ""
        this.accentChar = "";
        this.fallingInflectionChars = "";
    
        const chars = this.parseCharacters(word);
        if (chars) {
            const accents = this.parseAccents(word, chars.length);

            if (accents && accents.length > 0) {
                this.hasPronunciationGuide.emit(true);
                this.processAccent(chars, accents[0]);
                this.processTransforms();
            } else {
                this.hasPronunciationGuide.emit(false);
            }
        }
    }

    private processAccent(chars: string[], accent: number): void {
        this.accentType = this.getAccentType(chars, accent);
        this.accentLineColorClass = ACCENT_TYPE_COLOR_CLASS[this.accentType];

        if (this.accentType === AccentType.Heiban) {
            if (chars.length === 1) {
                this.flatCharsOverline = chars[0];
            } else {
                this.flatCharsUnderline = chars[0];
                for (let idx = 1; idx < chars.length; idx++) {
                    this.flatCharsOverline += chars[idx];
                }
            }
        } else {
            this.risingInflectionChars = "";
            this.fallingInflectionChars = "";
            for (let i = 0; i < chars.length; i++) {
                if (i + 1 < accent) {
                    this.risingInflectionChars += chars[i];
                } else if (i + 1 === accent) {
                    this.accentChar = chars[i];
                } else {
                    this.fallingInflectionChars += chars[i];
                }
            }
        }          
    }

    private getAccentType(chars: string[], accent: number): AccentType {
        if (accent === 0) {
            return AccentType.Heiban;
        }
        if (accent === chars.length) {   // consider single-mora words odaka if accented
            return AccentType.ODaka;
        }
        if (accent === 1) {
            return AccentType.AtamaDaka;
        }

        return AccentType.NakaDaka;
    }

    private parseCharacters(word: Word): string[] {
        let chars: string[] = [];

        const kana: string = word.elements[KANA_ELEMENT];
        if (kana) {
            for (let ch of kana) {
                if (chars.length > 0 && SMALL_KANA.includes(ch)) {
                    chars[chars.length - 1] += ch;
                } else {
                    chars.push(ch);
                } 
            }
        }

        return chars;
    }

    private parseAccents(word: Word, charCnt: number): number[] {
        let accents: number[] =[];

        const accentElement: string = word.elements[ACCENT_ELEMENT];
        if (accentElement || accentElement === "0") {
            for (let accentStr of accentElement.split(",")) {
                const accent = parseInt(accentStr);
                if ((accent || accent === 0) && (accent >= 0) && (accent <= charCnt) && (!accents.includes(accent))) {   // Could be NaN so need to check for truthiness, but also need to explicitly check for 0 since 0 is a valid accent position
                    accents.push(accent);
                }
            }
        }

        return accents;
    }

    private processTransforms(): void {
        setTimeout(() => {
            this.risingInflectionTransform = this.calculateInflectionTransform(this.risingInflectionLineDiv, true);
            this.fallingInflectionTransform = this.calculateInflectionTransform(this.fallingInflectionLineDiv, false);
            this.accentTransform = this.calculateAccentTransform(this.accentLineDiv);
        });
    }

    override updateWord(word: Word): void {
        this.word = word;
        this.processWord(word);
    }
}