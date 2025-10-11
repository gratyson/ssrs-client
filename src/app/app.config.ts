import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpClientXsrfModule, provideHttpClient, withXsrfConfiguration } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [ 
    provideAnimations(), 
    [ provideRouter(routes, withComponentInputBinding()) ], 
    provideHttpClient(withXsrfConfiguration({ cookieName: "XSRF-TOKEN", headerName: "X-XSRF-Token" })),
  ]
};