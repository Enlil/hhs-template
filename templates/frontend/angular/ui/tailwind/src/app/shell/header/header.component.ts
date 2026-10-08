import { Component } from '@angular/core';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';

// The search field and the avatar are for show: nothing is searched and nobody is signed in until you add it.
@Component({
  selector: 'app-header',
  imports: [AvatarComponent, SearchFieldComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  protected readonly appName = '{{projectName}}';
}
