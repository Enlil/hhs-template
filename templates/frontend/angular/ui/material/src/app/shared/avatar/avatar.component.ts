import { Component, Input } from '@angular/core';

// A round badge with someone's initials. For a photo, put an <img> with a round border-radius in its place.
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.css',
})
export class AvatarComponent {
  /** Shown as initials, and read out by screen readers. */
  @Input() name = '';
  @Input() size: 'sm' | 'md' = 'md';

  protected get initials(): string {
    return this.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }
}
