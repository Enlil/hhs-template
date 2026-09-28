import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { InputComponent } from '../../shared/input/input.component';

@Component({
  selector: 'app-login',
  imports: [ButtonComponent, CardComponent, InputComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly router = inject(Router);
  protected readonly appName = '{{projectName}}';

  // Visual only: no authentication, sessions, or API calls. Submitting just
  // navigates to the dashboard so the rest of the starter UI is reachable.
  protected handleSubmit(event: Event): void {
    event.preventDefault();
    void this.router.navigate(['/dashboard']);
  }
}
