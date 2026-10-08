import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

export interface BreadcrumbItem {
  label: string;
  /** Leave out for the page you are on, which is the last item. */
  path?: string;
}

@Component({
  selector: 'app-breadcrumb',
  imports: [NgIcon, RouterLink],
  templateUrl: './breadcrumb.component.html',
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
}
