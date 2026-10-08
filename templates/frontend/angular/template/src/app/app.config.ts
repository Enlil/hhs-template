import { provideHttpClient } from '@angular/common/http';
import type { ApplicationConfig } from '@angular/core';
import { provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { routes } from './app.routes';
import { APP_ICONS } from './core/icons';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // withComponentInputBinding: lets PlaceholderComponent's `title` @Input()
    // be set straight from each route's `data.title` (see app.routes.ts).
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    // The Heroicons the app uses (core/icons.ts), for <ng-icon>.
    provideIcons(APP_ICONS),
  ],
};
