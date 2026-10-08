import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

@Component({
  selector: 'app-modal',
  imports: [NgIcon],
  templateUrl: './modal.component.html',
})
export class ModalComponent {
  @Input() open = false;
  @Input() modalTitle = '';
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open) this.closed.emit();
  }

  protected close(): void {
    this.closed.emit();
  }
}
