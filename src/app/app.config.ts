import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { authorizationIntercept } from './app-module';

export const appConfig: ApplicationConfig = {
  providers: [ 
    [ provideRouter(routes, withComponentInputBinding()) ], 
    provideHttpClient(withXsrfConfiguration({ cookieName: "XSRF-TOKEN", headerName: "X-XSRF-Token" }),
                      withInterceptors([ authorizationIntercept ]))
]};