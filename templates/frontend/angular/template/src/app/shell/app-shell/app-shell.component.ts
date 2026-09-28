import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { PageContainerComponent } from '../page-container/page-container.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopNavigationComponent } from '../top-navigation/top-navigation.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, TopNavigationComponent, SidebarComponent, PageContainerComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {}
