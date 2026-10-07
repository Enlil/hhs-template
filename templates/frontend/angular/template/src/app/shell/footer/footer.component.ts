import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  // Named "buildVersion", not "appVersion" — the latter is one of the CLI's
  // own placeholder names and would get rendered as static text in the .html
  // file instead of staying a live Angular binding. See README "Template
  // development" for the full explanation of this gotcha.
  protected readonly appName = environment.appName;
  protected readonly buildVersion = environment.appVersion;
}
