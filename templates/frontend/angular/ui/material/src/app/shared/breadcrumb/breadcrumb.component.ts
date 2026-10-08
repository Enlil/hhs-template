import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

export interface BreadcrumbItem {
  label: string;
  /** Leave out for the page you are on, which is the last item. */
  path?: string;
}

// Angular Material has no breadcrumb, so this one is plain HTML in the guide's style.
@Component({
  selector: 'app-breadcrumb',
  imports: [NgIcon, RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
