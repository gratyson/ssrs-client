import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpClientModule, HttpClientXsrfModule } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [ 
    provideAnimations(), 
    [ provideRouter(routes, withComponentInputBinding()) ], 
    importProvidersFrom(HttpClientModule),
    importProvidersFrom(HttpClientXsrfModule.withOptions({ cookieName: "XSRF-TOKEN", headerName: "X-XSRF-Token" }))
  ]
};

