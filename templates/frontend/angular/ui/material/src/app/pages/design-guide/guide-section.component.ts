import { Component, Input } from '@angular/core';

// A titled block of the design guide page: <app-guide-section sectionId="icons" title="Icons" description="...">.
@Component({
  selector: 'app-guide-section',
  templateUrl: './guide-section.component.html',
  styleUrl: './guide-section.component.css',
})
export class GuideSectionComponent {
  @Input() sectionId = '';
  @Input() title = '';
  @Input() description = '';
}
