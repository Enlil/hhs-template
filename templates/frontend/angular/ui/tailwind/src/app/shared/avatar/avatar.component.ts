import { Component, Input } from '@angular/core';

// A round badge with someone's initials. For a photo, put an <img class="size-14 rounded-full"> in its place.
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
})
export class AvatarComponent {
  /** Shown as initials, and read out by screen readers. */
  @Input() name = '';
  @Input() size: 'sm' | 'md' = 'md';
  @Input() className = '';

  protected get initials(): string {
    return this.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('');
  }

  protected get sizeClasses(): string {
    return this.size === 'md' ? 'size-14 text-h2' : 'size-10 text-content-2';
  }
}
