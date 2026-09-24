import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  email = '';
  password = '';
  remember = false;
  loading = false;
  errorMessage = '';
  successMessage = this.route.snapshot.queryParamMap.get('registered') === '1'
    ? 'Compte cree, vous pouvez maintenant vous connecter.'
    : '';
  expiredMessage = this.route.snapshot.queryParamMap.get('expired') === 'true'
    ? 'Votre session a expire, veuillez vous reconnecter.'
    : '';

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir l email et le mot de passe.';
      return;
    }

    this.loading = true;

    this.authService
      .login({
        email: this.email,
        motDePasse: this.password,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          void this.router.navigateByUrl('/home');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;

          if (error.status === 401 || error.status === 403) {
            this.errorMessage = 'Email ou mot de passe incorrect.';
            return;
          }

          if (error.status === 0) {
            this.errorMessage = 'Backend inaccessible. Verifie que l API tourne.';
            return;
          }

          this.errorMessage = 'Une erreur est survenue lors de la connexion.';
        },
      });
  }
}
