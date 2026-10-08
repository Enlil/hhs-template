import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { PageContainerComponent } from '../page-container/page-container.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopNavigationComponent } from '../top-navigation/top-navigation.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, TopNavigationComponent, SidebarComponent, PageContainerComponent, FooterComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {}
