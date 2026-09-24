import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { Loan } from '../../shared/models/loan.model';

const STATUTS_EN_COURS: Loan['statut'][] = ['EN COURS', 'EN RETARD'];

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/loans`;

  getMyLoans() {
    return this.http.get<Loan[]>(`${this.url}/me`);
  }

  borrow(bookId: number) {
    return this.http.post<Loan>(`${this.url}`, { bookId });
  }

  hasActiveLoanOn(bookId: number) {
    return this.getMyLoans().pipe(
      map(loans => loans.some(l =>
        l.livreId === bookId && STATUTS_EN_COURS.includes(l.statut)
      )),
    );
  }
}
