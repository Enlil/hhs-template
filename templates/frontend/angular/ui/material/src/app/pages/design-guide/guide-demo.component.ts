import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

// One titled panel of the design guide page. `class` on <app-guide-demo> can make it span several columns of the grid.
@Component({
  selector: 'app-guide-demo',
  imports: [MatCardModule],
  templateUrl: './guide-demo.component.html',
  styleUrl: './guide-demo.component.css',
})
export class GuideDemoComponent {
  @Input() title = '';
}
