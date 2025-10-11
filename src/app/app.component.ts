import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppHeaderComponent } from './home/components/header/app-header-component';

@Component({
    selector: 'app-root',
    template: `
    <div class="ssrs-app">
      <div class="ssrs-header">
        <app-header />
      </div>
      <div class="ssrs-body">
        <router-outlet></router-outlet>
      </div>
    <div>
  `,
    styles: `
    .ssrs-app {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .ssrs-body {
      flex: 1;
      overflow: auto;
    }
  `,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, AppHeaderComponent]
})
export class AppComponent {
}
