import { Component, Input } from '@angular/core';

// One titled panel of the design guide page. `class` on <app-guide-demo> can make it span several columns of the grid.
@Component({
  selector: 'app-guide-demo',
  templateUrl: './guide-demo.component.html',
  host: { class: 'block' },
})
export class GuideDemoComponent {
  @Input() title = '';
}
