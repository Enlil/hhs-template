import { Component } from '@angular/core';
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
import { ButtonComponent } from '../../shared/button/button.component';
import { CheckboxComponent } from '../../shared/checkbox/checkbox.component';
import { InputComponent } from '../../shared/input/input.component';
import { MenuItemComponent } from '../../shared/menu-item/menu-item.component';
import { RadioComponent } from '../../shared/radio/radio.component';
import { SearchFieldComponent } from '../../shared/search-field/search-field.component';
import { SegmentedToggleComponent, type ToggleOption } from '../../shared/segmented-toggle/segmented-toggle.component';
import { SelectComponent } from '../../shared/select/select.component';
import { SnackbarComponent, type SnackbarStatus } from '../../shared/snackbar/snackbar.component';
import { StepComponent } from '../../shared/step/step.component';
import { TabsComponent } from '../../shared/tabs/tabs.component';
import { TagComponent } from '../../shared/tag/tag.component';
import { TextareaComponent } from '../../shared/textarea/textarea.component';
import { GuideDemoComponent } from './guide-demo.component';
import { GuideSectionComponent } from './guide-section.component';

// A sample of the HHS-approved TEDS UX / UI style guide, made with this app's
// own tokens and components, so what you see here is what your pages get.
// Everything on it comes from core/design-guide.ts and src/app/shared.

// How each step of the type scale is written in Tailwind. Whole class names, so Tailwind can find them.
const TYPE_CLASSES: Record<string, string> = {
  h1: 'font-title text-h1',
  h2: 'font-title text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  'content-1': 'text-content-1',
  'content-2': 'text-content-2',
  'content-3': 'text-content-3',
  'content-4': 'text-content-4',
};

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
    ButtonComponent,
    CheckboxComponent,
    GuideDemoComponent,
    GuideSectionComponent,
    InputComponent,
    MenuItemComponent,
    NgIcon,
    RadioComponent,
    SearchFieldComponent,
    SegmentedToggleComponent,
    SelectComponent,
    SnackbarComponent,
    StepComponent,
    TabsComponent,
    TagComponent,
    TextareaComponent,
  ],
  templateUrl: './design-guide.component.html',
})
export class DesignGuideComponent {
  protected readonly figmaUrl = DESIGN_GUIDE_FIGMA_URL;
  protected readonly typeGroups = [
    { title: 'Title', styles: TYPE_SCALE.slice(0, 4) },
    { title: 'Content', styles: TYPE_SCALE.slice(4) },
  ];
  protected readonly typeClasses = TYPE_CLASSES;
  protected readonly colorGroups = COLOR_GROUPS;
  protected readonly colorSystem = COLOR_SYSTEM;
  protected readonly gradients = GRADIENTS;
  protected readonly icons = ICONS;

  // For the component samples.
  protected readonly tags = ['Tag', 'Tag', 'Tag', 'Tag', 'Tag', 'Tag'];
  protected readonly tabs = ['Active Tab', 'Inactive Tab'];
  protected readonly themeOptions: ToggleOption[] = [
    { value: 'light', label: 'Light', icon: 'heroSunSolid' },
    { value: 'dark', label: 'Dark', icon: 'heroMoonSolid' },
  ];
  protected readonly breadcrumbItems: BreadcrumbItem[] = [{ label: 'Applications', path: '/link-one' }, { label: 'Capture Document' }];

  protected tab = 'Active Tab';
  protected theme = 'light';
  protected snackbars: SnackbarStatus[] = ['success', 'alert'];

  protected dismiss(status: SnackbarStatus): void {
    this.snackbars = this.snackbars.filter((shown) => shown !== status);
  }

  protected showSnackbarsAgain(): void {
    this.snackbars = ['success', 'alert'];
  }
}
