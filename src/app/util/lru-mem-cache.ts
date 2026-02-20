import { map, Observable, of } from "rxjs";

const PURGE_PERCENT: number = .25;
const DEFAULT_MAX_SIZE: number = 500;

// In-memory least recently used cache with expiration
export class LRUMemCache<T> {

    private maxSize: number;
    private cache: { [k: string]: MemCacheEntry<T> };
    private curSize: number;

    public constructor(maxSize?: number) {
        if (maxSize) {
            this.maxSize = maxSize;
        } else {
            this.maxSize = DEFAULT_MAX_SIZE ;
        }

        this.cache = {};
        this.curSize = 0;
    }

    public getOrCache(key: string, cacheFunction: (k: string) => Observable<CacheDataWithExpiration<T>>): Observable<T> {
        const cachedValue: T | null = this.getEntry(key);
        if (cachedValue !== null) {
            return of(cachedValue);
        }

        return cacheFunction(key).pipe(map(cacheDataWithExpiration => this.addCacheEntry(key, cacheDataWithExpiration)));
    } 

    private addCacheEntry(key: string, entryData: CacheDataWithExpiration<T>): T {
        if (!(key in this.cache) && this.curSize >= this.maxSize) {
            this.purgeOldestEntries();
        }

        this.cache[key] = {
            data: entryData.data,
            expiration: entryData.expiration,
            lastAccess: new Date()
        }

        return entryData.data;
    }

    public getEntry(key: string): T | null {
        if (key in this.cache) {
            const now = new Date();

            if (this.cache[key].expiration > now) {
                this.cache[key].lastAccess = now;
                return this.cache[key].data;
            }
        }

        return null;
    }

    private purgeOldestEntries(): void {
        const keysToPurge: string[] = this.getKeysToPurge();

        for (let key of keysToPurge) {
            delete this.cache[key];
        }
    }

    private getKeysToPurge(): string[] {
        let keyAndLastAccess: KeyAndLastAccess[] = [];
        Object.keys(this.cache).forEach(key => keyAndLastAccess.push({ key: key, lastAccess: this.cache[key].lastAccess }));
        keyAndLastAccess.sort((l, r) => l.lastAccess.getTime() - r.lastAccess.getTime());

        const cntToPurge = Math.floor(keyAndLastAccess.length * PURGE_PERCENT);
        let keysToPurge: string[] = [];
        for (let i = 0; i < cntToPurge; i++) {
            keysToPurge.push(keyAndLastAccess[keyAndLastAccess.length - 1 - i].key);
        }

        return keysToPurge;
    }
}

export interface CacheDataWithExpiration<T> {
    data: T;
    expiration: Date;
}

interface MemCacheEntry<T> {
    data: T;
    expiration: Date
    lastAccess: Date
}

interface KeyAndLastAccess {
    key: string;
    lastAccess: Date;
}