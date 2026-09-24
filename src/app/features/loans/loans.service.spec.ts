import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { LoansService } from './loans.service';
import type { Loan } from '../../shared/models/loan.model';

function loan(livreId: number, statut: Loan['statut']): Loan {
  return {
    id: 1,
    livreId,
    titre: 'Clean Code',
    auteur: 'Robert C. Martin',
    urlCouverture: '',
    dateParution: '2008-08-01',
    dateEmprunt: '2026-01-01',
    dateRetourPrevue: '2026-01-15',
    statut,
  };
}

describe('LoansService', () => {
  let service: LoansService;
  let httpStub: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

  /** Monte le service avec un HttpClient simulé renvoyant les emprunts donnés. */
  function setUp(loans: Loan[]) {
    httpStub = {
      get: vi.fn().mockReturnValue(of(loans)),
      post: vi.fn().mockReturnValue(of(loan(42, 'EN COURS'))),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: httpStub }],
    });

    service = TestBed.inject(LoansService);
  }

  it('reconnaît un emprunt en cours sur le livre demandé', async () => {
    setUp([loan(42, 'EN COURS')]);

    expect(await firstValue(service.hasActiveLoanOn(42))).toBe(true);
  });

  it('considère un emprunt en retard comme toujours détenu', async () => {
    setUp([loan(42, 'EN RETARD')]);

    expect(await firstValue(service.hasActiveLoanOn(42))).toBe(true);
  });

  it('ignore un emprunt rendu, le livre étant ré-empruntable', async () => {
    // RG-LOAN-04 du cahier des charges
    setUp([loan(42, 'RENDU')]);

    expect(await firstValue(service.hasActiveLoanOn(42))).toBe(false);
  });

  it('ignore un emprunt en cours portant sur un autre livre', async () => {
    setUp([loan(7, 'EN COURS')]);

    expect(await firstValue(service.hasActiveLoanOn(42))).toBe(false);
  });

  it('renvoie faux lorsque le lecteur n\'a aucun emprunt', async () => {
    setUp([]);

    expect(await firstValue(service.hasActiveLoanOn(42))).toBe(false);
  });
});

function firstValue<T>(source: { subscribe: (o: { next: (v: T) => void }) => void }): Promise<T> {
  return new Promise<T>(resolve => source.subscribe({ next: resolve }));
}
