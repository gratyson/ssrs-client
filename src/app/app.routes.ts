import { ActivatedRouteSnapshot, CanActivateChildFn, Route, Router, RouterStateSnapshot, Routes } from "@angular/router";
import { LexiconBrowseComponent } from "./home/components/lexicon-browse/lexicon-browse.component";
import { LexiconEdit } from "./lexicon/components/lexicon-edit/lexicon-edit.component";
import { LoginComponent } from "./security/login/login.component";
import { UserService } from "./security/user-service";
import { inject } from "@angular/core";
import { map } from "rxjs";
import { RegisterComponent } from "./security/register/register.component";
import { LearningSessionComponent } from "./review/components/session-container/learning-session.component";
import { ReviewSessionComponent } from "./review/components/session-container/review-session.component";
import { LexiconSummaryComponent } from "./lexicon/components/lexicon-summary/lexicon-summary.component";
import { EditUserSettingsComponent } from "./user-config/edit-user-settings/edit-user-settings.component";
import { UserNotepadComponent } from "./user-config/user-scratch-pad/user-notepad.component";

const loginGuardFunction: CanActivateChildFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ) => {
    const userService: UserService = inject(UserService);
    const router = inject(Router);
    
    return userService.refreshLoggedIn().pipe(map(isLoggedIn => {
        if (!isLoggedIn) {
            router.navigate([ 'app/login' ]);
        }

        return isLoggedIn;
    }));
}

export const routes: Route[] = [
    { path: "app", component: LexiconBrowseComponent, canActivate: [ loginGuardFunction ]  },
    { path: "app/editLexicon/:lexiconId", component: LexiconEdit, canActivate: [ loginGuardFunction ] },
    { path: "app/summary/:lexiconId", component: LexiconSummaryComponent, canActivate: [ loginGuardFunction ] },
    { path: "app/learn/:lexiconId", component: LearningSessionComponent, canActivate: [ loginGuardFunction ] },
    { path: "app/review/:lexiconId/:testRelationship", component: ReviewSessionComponent, canActivate: [ loginGuardFunction ] },
    { path: "app/review/:lexiconId", component: ReviewSessionComponent, canActivate: [ loginGuardFunction ] },
    { path: "app/config" , component: EditUserSettingsComponent, canActivate: [loginGuardFunction] },
    { path: "app/notepad" , component: UserNotepadComponent, canActivate: [loginGuardFunction] },
    { path: "app/login", component: LoginComponent },
    { path: "app/register", component: RegisterComponent },
    { path: '',   redirectTo: '/app', pathMatch: 'full' },
];