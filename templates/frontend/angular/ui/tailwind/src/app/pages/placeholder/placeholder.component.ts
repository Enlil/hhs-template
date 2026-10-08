import { Component, Input } from '@angular/core';
import { CardComponent } from '../../shared/card/card.component';

// Reused for every nav destination that doesn't have real content yet —
// `title` is bound from the route's `data.title` via withComponentInputBinding()
// in app.config.ts. Exists so the navigation itself is fully wired up, not to
// demonstrate a real feature.
@Component({
  selector: 'app-placeholder',
  imports: [CardComponent],
  templateUrl: './placeholder.component.html',
})
export class PlaceholderComponent {
  @Input() title = '';
}
