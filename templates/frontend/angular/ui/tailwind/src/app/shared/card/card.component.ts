import { Component, Input } from '@angular/core';

// A translucent white panel (the `glass` class, see src/styles/tailwind-theme.css). Where the card sits in
// its parent (a grid column, a width) is set with `class` on <app-card> itself; `className` is for the panel.
@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  host: { class: 'block' },
})
export class CardComponent {
  @Input() cardTitle = '';
  @Input() className = '';
}
