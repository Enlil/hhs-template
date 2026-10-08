import { Component, Input } from '@angular/core';

// A small label with a thin blue edge, like the guide's tag.
@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
})
export class TagComponent {
  @Input() className = '';
}
