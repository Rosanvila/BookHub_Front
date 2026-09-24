import {HttpErrorResponse, HttpHandlerFn, HttpRequest} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {Router} from '@angular/router';
import {of, throwError} from 'rxjs';
import {vi} from 'vitest';

import {authInterceptor} from './auth.interceptor';
import {AuthService} from '../auth/auth.service';

describe('authInterceptor', () => {
  let authStub: { getToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };
  let routerStub: { navigate: ReturnType<typeof vi.fn>; url: string };

  function setUp(token: string | null) {
    authStub = {getToken: vi.fn().mockReturnValue(token), logout: vi.fn()};
    routerStub = {navigate: vi.fn(), url: '/books/42'};

    TestBed.configureTestingModule({
      providers: [
        {provide: AuthService, useValue: authStub},
        {provide: Router, useValue: routerStub},
      ],
    });
  }

  /** Exécute l'intercepteur dans le contexte d'injection du TestBed. */
  function run(next: HttpHandlerFn) {
    const req = new HttpRequest('POST', '/api/loans', {bookId: 42});
    return TestBed.runInInjectionContext(() => authInterceptor(req, next));
  }

  it('ajoute le jeton sur la requête sortante', () => {
    setUp('jeton-valide');
    const next = vi.fn().mockImplementation((req: HttpRequest<unknown>) => {
      expect(req.headers.get('Authorization')).toBe('Bearer jeton-valide');
      return of({} as never);
    });

    run(next).subscribe();

    expect(next).toHaveBeenCalled();
  });

  it('laisse passer la requête sans en-tête quand aucun jeton n\'est stocké', () => {
    setUp(null);
    const next = vi.fn().mockImplementation((req: HttpRequest<unknown>) => {
      expect(req.headers.has('Authorization')).toBe(false);
      return of({} as never);
    });

    run(next).subscribe();

    expect(next).toHaveBeenCalled();
  });

  it('déconnecte et redirige vers la connexion sur un 401', () => {
    // US-ERR-TOKEN-01 : jeton expiré, l'utilisateur doit être ramené au formulaire
    setUp('jeton-perime');
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({status: 401})),
    );

    run(next).subscribe({error: () => undefined});

    expect(authStub.logout).toHaveBeenCalled();
    expect(routerStub.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      {queryParams: {expired: true, redirect: '/books/42'}},
    );
  });

  it('ne redirige pas sur un 403, qui relève des droits et non de la session', () => {
    setUp('jeton-valide');
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({status: 403})),
    );

    run(next).subscribe({error: () => undefined});

    expect(authStub.logout).not.toHaveBeenCalled();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('ne redirige pas sur un 401 reçu sans jeton, par exemple un échec de connexion', () => {
    setUp(null);
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({status: 401})),
    );

    run(next).subscribe({error: () => undefined});

    expect(routerStub.navigate).not.toHaveBeenCalled();
  });
});
