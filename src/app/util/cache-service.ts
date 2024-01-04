import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { Observable, map, of } from "rxjs";

const CACHE_PREFIX = "cache-";

@Injectable({providedIn: "root"})
export class CacheService {

    private cacheTimeoutMs: number = environment.CACHE_EXPIRATION_TIME_IN_MS;

    public getValue<T>(key: string, cacheFunction: ((key: string) => Observable<T>) | (() => Observable<T>)): Observable<T> {
        let cacheKey: string = this.buildCacheKey(key);

        const entryString: string | null = sessionStorage.getItem(cacheKey)
        if (entryString != null) {
            const entry: CacheEntry = JSON.parse(entryString);

            if (new Date().getTime() < entry.expiration) {
                return of(JSON.parse(entry.data, (k, v) => this.mapReviver(k, v)));
            }
        }

        // not in cache or expired, need look up and cache new values
        return cacheFunction(key).pipe(map((newData) => {
            sessionStorage.setItem(cacheKey, JSON.stringify(this.buildCacheEntry(newData)));
            return newData;
        }));
    }

    public updateValue<T>(key: string, value: T) {
        console.log(`Setting ${key}=${JSON.stringify(this.buildCacheEntry(value))}`);
        sessionStorage.setItem(this.buildCacheKey(key), JSON.stringify(this.buildCacheEntry(value)));
    }

    public clearValue(key: string) {
        sessionStorage.removeItem(this.buildCacheKey(key));
    }

    private buildCacheKey(key: string): string {
        return CACHE_PREFIX + key;
    }

    private buildCacheEntry<T>(value: T) {
        const newDataString = JSON.stringify(value, (k, v) => this.mapReplacer(k, v));
        return new CacheEntry(newDataString, new Date().getTime() + this.cacheTimeoutMs);
    }

    private mapReplacer(key: any, value: any) {
        if(value instanceof Map) {
            return {
                dataType: 'Map',
                value: Array.from(value.entries()), // or with spread: value: [...value]
            };
        }

        return value;
    }
      
    private mapReviver(key: any, value: any) {
        if(typeof value === 'object' && value !== null) {
            if (value.dataType === 'Map') {
                return new Map(value.value);
            }
        }

        return value;
    }
}

class CacheEntry {
    readonly data: string;
    readonly expiration: number;

    constructor(data: string, expiration: number) {
        this.data = data;
        this.expiration = expiration;
    }
}