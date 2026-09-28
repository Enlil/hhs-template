import { provideHttpClient } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding: lets PlaceholderComponent's `title` @Input()
    // be set straight from each route's `data.title` (see app.routes.ts).
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
  ],
};
