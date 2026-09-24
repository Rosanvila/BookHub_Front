import {HttpErrorResponse, HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {catchError, throwError} from 'rxjs';
import {AuthService} from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const token = authService.getToken();

    const request = token
        ? req.clone({setHeaders: {Authorization: `Bearer ${token}`}})
        : req;

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            // 401 : le jeton présenté est périmé ou invalide, on repart de la connexion
            if (error.status === 401 && token) {
                authService.logout();
                router.navigate(['/auth/login'], {
                    queryParams: {expired: true, redirect: router.url},
                });
            }
            return throwError(() => error);
        }),
    );
};
