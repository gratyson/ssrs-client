import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Language, WordElement } from "./language";
import { CacheService } from "../util/cache-service";
import { map, Observable } from "rxjs";
import { LanguageClient } from "../client/language-client";

const ELEMENT_CACHE_NAME: string = "language-elements";
const LANGUAGE_CACHE_NAME: string = "language-";

@Injectable({providedIn: 'root'})
export class LanguageService {

    private languageClient: LanguageClient = inject(LanguageClient);

    constructor(private cacheService: CacheService) { }

    public getLanguage(id: number): Observable<Language> {
        return this.cacheService.getValue(LANGUAGE_CACHE_NAME, () => this.loadLanguageMap()).pipe(map((languages) => {
            return languages[id];
        }));
    }

    public getAllLanguages(): Observable<Language[]> {
        return this.cacheService.getValue(LANGUAGE_CACHE_NAME, () => this.loadLanguageMap()).pipe(map((languageMap) => {
            return Array.from(Object.values(languageMap).sort((l, r) => l.id - r.id));
        }));
    }

    public getWordElementMap(): Observable<{ [k:string]: WordElement }> {
        return this.cacheService.getValue(ELEMENT_CACHE_NAME, () => this.loadWordElementMap())
    }

    public getLanguageElement(elementId: string): Observable<WordElement> {
        return this.getWordElementMap().pipe(map((elementMap) => elementMap[elementId]));
    }

    private loadLanguageMap(): Observable<{ [k:string]: Language }> {
        return this.languageClient.loadAllLanguages().pipe(map((languages) => {
            let languageMap: { [k:string]: Language } = {};

            for (let language of languages) {
                languageMap[language.id] = language;
            }

            return languageMap;
        }));
    }

    private loadWordElementMap(): Observable<{ [k:string]: WordElement }> {
        return this.languageClient.loadAllWordElements().pipe(map((wordElements) => {
            let wordElementMap: { [k:string]: WordElement} = {};
            for (let wordElement of wordElements) {
                wordElementMap[wordElement.id] = wordElement;
            }

            return wordElementMap;
        }));
    }
}