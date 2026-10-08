import { Component, EventEmitter, Input, Output } from '@angular/core';

// The look of one tab, shared by <app-tabs> and the top navigation (whose tabs are links).
export function tabClasses(active: boolean): string {
  return `shrink-0 border-b-2 px-6 py-4 text-h4 text-text transition-colors ${
    active ? 'border-primary' : 'border-transparent hover:border-base-light'
  }`;
}

// A row of tabs that switch in-page content; you supply the content, and give it role="tabpanel". The
// left and right arrow keys move between the tabs, as users expect.
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.component.html',
})
export class TabsComponent {
  /** What the tabs switch between, for screen readers. */
  @Input() label = '';
  @Input() tabs: string[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  protected readonly tabClasses = tabClasses;

  protected onKeydown(event: KeyboardEvent): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (this.tabs.indexOf(this.value) + step + this.tabs.length) % this.tabs.length;
    this.valueChange.emit(this.tabs[next]);
    // Wait for the new tab to become the focusable one, then focus it.
    queueMicrotask(() => (event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus());
  }
}
