import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {
this.loginForm = this.fb.group({
  identity: ['admin@calix-sport.com', [Validators.required]],
  password: ['admin$2026', [Validators.required]],
  rememberMe: [true]
});
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.cd.detectChanges();
      return;
    }

    this.loading = true;
    this.cd.detectChanges();

    try {
      const { identity, password } = this.loginForm.getRawValue();
      const user = await this.auth.login(identity, password);

      this.loading = false;
      this.cd.detectChanges();

      this.auth.redirectToDashboard(user);
    } catch (error: any) {
      this.errorMessage = error?.message || 'No fue posible iniciar sesión';
      this.loading = false;
      this.cd.detectChanges();
    }
  }
}