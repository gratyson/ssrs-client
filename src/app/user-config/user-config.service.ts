import { Injectable, inject } from "@angular/core";
import { UserConfigSetting } from "./user-config-setting";
import { Observable, map, of } from "rxjs";
import { CacheService } from "../util/cache-service";
import { UserConfigClient } from "../client/user-config-client";

export const USER_CONFIG_CACHE_KEY: string = "userConfig";

@Injectable({providedIn: "root"})
export class UserConfigService {
    
    private userConfigClient: UserConfigClient = inject(UserConfigClient);
    private cacheService: CacheService = inject(CacheService);

    private nonPersistantConfig: { [k: string]: string } = {};

    private getCurrentUserConfig(persistantConfig: boolean): Observable<{ [k: string]: string }> {
        if (persistantConfig) {
            return this.cacheService.getValue<{ [k: string]: string }>(USER_CONFIG_CACHE_KEY, () => this.userConfigClient.getUserConfig());
        } else {
            return of(this.nonPersistantConfig);
        }

    }

    public getCurrentConfigValue<T>(setting: UserConfigSetting<T>): Observable<T> {
        return this.getCurrentUserConfig(setting.persist).pipe(map((userConfig) => {
            const configVal: string = userConfig[setting.name];

            if (configVal) {
                const parsedConfigVal: T | null = setting.parser.parseSettingValue(configVal);
                if (parsedConfigVal != null) {
                    return parsedConfigVal;
                }
            }
            
            return setting.defaultValue;
        }));
    }

    public setCurrentConfigValue<T>(setting: UserConfigSetting<T>, value: T): Observable<void> {
        if (!setting.persist) {
            this.nonPersistantConfig[setting.name] = setting.parser.settingValueToString(value);
            return of();
        }

        return this.getCurrentUserConfig(setting.persist).pipe(map<{ [k: string]: string }, void>((userConfig) => {
            userConfig[setting.name] = setting.parser.settingValueToString(value);
            
            this.cacheService.updateValue(USER_CONFIG_CACHE_KEY, userConfig);
            return this.userConfigClient.saveUserConfig(userConfig).subscribe();
        }));
    }
}