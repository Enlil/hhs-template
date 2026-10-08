import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { FooterComponent } from '../../shell/footer/footer.component';

@Component({
  selector: 'app-login',
  imports: [MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, FooterComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
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
