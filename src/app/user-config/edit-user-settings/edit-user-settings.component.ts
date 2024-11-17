import { Component, inject } from "@angular/core";
import { UserConfigService } from "../user-config.service";
import { EDITABLE_SETTINGS, UserConfigSetting } from "../user-config-setting";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";

@Component({
    selector: "edit-user-settings",
    templateUrl: "edit-user-settings.html",
    styleUrl: "edit-user-settings.css",
    standalone: true,
    imports: [ MatInputModule, FormsModule, MatFormFieldModule, MatButtonModule, MatIconModule, MatSelectModule, RouterLink ],
})
export class EditUserSettingsComponent {

    private userConfigService: UserConfigService = inject(UserConfigService);

    editableSettings: UserConfigSetting<any>[] = EDITABLE_SETTINGS;
    currentSettingValues: { [k: string]: string };

    public ngOnInit(): void {
        this.currentSettingValues = {};

        // Subscribe to one and do the remaining in a loop after lookup is complete. All settings should get cached upon the first lookup,
        // so any lookups after the first should not need to hit the server. 
        this.userConfigService.getCurrentConfigValue(EDITABLE_SETTINGS[0]).subscribe((settingValue) => {            
            
            if (settingValue !== EDITABLE_SETTINGS[0].defaultValue) {
                this.currentSettingValues[EDITABLE_SETTINGS[0].name] = EDITABLE_SETTINGS[0].parser.settingValueToString(settingValue);
            }

            for (let idx = 1; idx < EDITABLE_SETTINGS.length; idx++) {
                const setting = EDITABLE_SETTINGS[idx];
                this.userConfigService.getCurrentConfigValue(setting).subscribe((settingValue) => {
                    if (settingValue !== setting.defaultValue) {
                        this.currentSettingValues[setting.name] = setting.parser.settingValueToString(settingValue);
                    } else if (setting.selectableValues && setting.selectableValues.length > 0) {
                        // pre-select the default option if the settings uses defined options
                        this.currentSettingValues[setting.name] = setting.parser.settingValueToString(setting.defaultValue);
                    }
                });
            }
        });
    }


    onFieldUpdate<T>(setting: UserConfigSetting<T>): void {
        const settingStrValue: string = this.currentSettingValues[setting.name];

        if (settingStrValue) {
            const settingValue: T | null = setting.parser.parseSettingValue(settingStrValue);

            if (settingValue != null) {
                this.userConfigService.setCurrentConfigValue(setting, settingValue).subscribe();
            }
        }
    }
}