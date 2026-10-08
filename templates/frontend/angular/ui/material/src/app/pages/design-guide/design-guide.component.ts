import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { NgIcon } from '@ng-icons/core';
import {
  COLOR_GROUPS,
  COLOR_SYSTEM,
  DESIGN_GUIDE_FIGMA_URL,
  GRADIENTS,
  TYPE_SCALE,
} from '../../core/design-guide';
import type { AppIconName } from '../../core/icons';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { BreadcrumbComponent, type BreadcrumbItem } from '../../shared/breadcrumb/breadcrumb.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';
import { SnackbarComponent, type SnackbarStatus } from '../../shared/snackbar/snackbar.component';
import { StepComponent } from '../../shared/step/step.component';
import { GuideDemoComponent } from './guide-demo.component';
import { GuideSectionComponent } from './guide-section.component';

// A sample of the HHS-approved TEDS UX / UI style guide, made with Angular Material
// themed in src/styles.css, so what you see here is what your pages get.
// Everything on it comes from core/design-guide.ts, src/styles.css and src/app/shared.

const ICONS: Array<{ name: string; icon: AppIconName }> = [
  { name: 'magnifying-glass', icon: 'heroMagnifyingGlassSolid' },
  { name: 'chevron-down', icon: 'heroChevronDownSolid' },
  { name: 'chevron-right', icon: 'heroChevronRightSolid' },
  { name: 'check', icon: 'heroCheckSolid' },
  { name: 'check-circle', icon: 'heroCheckCircleSolid' },
  { name: 'x-circle', icon: 'heroXCircleSolid' },
  { name: 'x-mark', icon: 'heroXMarkSolid' },
  { name: 'exclamation-triangle', icon: 'heroExclamationTriangleSolid' },
  { name: 'sun', icon: 'heroSunSolid' },
  { name: 'moon', icon: 'heroMoonSolid' },
  { name: 'squares-2x2', icon: 'heroSquares2x2Solid' },
  { name: 'view-columns', icon: 'heroViewColumnsSolid' },
  { name: 'document-text', icon: 'heroDocumentTextSolid' },
  { name: 'users', icon: 'heroUsersSolid' },
  { name: 'swatch', icon: 'heroSwatchSolid' },
];

@Component({
  selector: 'app-design-guide',
  imports: [
    AvatarComponent,
    BreadcrumbComponent,
    GuideDemoComponent,
    GuideSectionComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatTabsModule,
    NgIcon,
    SearchFieldComponent,
    SnackbarComponent,
    StepComponent,
  ],
  templateUrl: './design-guide.component.html',
  styleUrl: './design-guide.component.css',
})
export class DesignGuideComponent {
  protected readonly figmaUrl = DESIGN_GUIDE_FIGMA_URL;
  protected readonly typeGroups = [
    { title: 'Title', styles: TYPE_SCALE.slice(0, 4) },
    { title: 'Content', styles: TYPE_SCALE.slice(4) },
  ];
  protected readonly colorGroups = COLOR_GROUPS;
  protected readonly colorSystem = COLOR_SYSTEM;
  protected readonly gradients = GRADIENTS;
  protected readonly icons = ICONS;

  // For the component samples.
  protected readonly tags = ['Tag', 'Tag', 'Tag', 'Tag', 'Tag', 'Tag'];
  protected readonly breadcrumbItems: BreadcrumbItem[] = [{ label: 'Applications', path: '/link-one' }, { label: 'Capture Document' }];

  protected theme = 'light';
  protected snackbars: SnackbarStatus[] = ['success', 'alert'];

  protected dismiss(status: SnackbarStatus): void {
    this.snackbars = this.snackbars.filter((shown) => shown !== status);
  }

  protected showSnackbarsAgain(): void {
    this.snackbars = ['success', 'alert'];
  }
}
