import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { LibrarianLoan } from '../../shared/models/loan.model';
import type { Reservation } from '../../shared/models/reservation.model';

@Injectable({ providedIn: 'root' })
export class LibrarianService {
  private http = inject(HttpClient);
  private readonly loansUrl = `${environment.apiUrl}/loans`;
  private readonly reservationsUrl = `${environment.apiUrl}/reservations`;

  getAllLoans() {
    return this.http.get<LibrarianLoan[]>(this.loansUrl);
  }

  returnLoan(id: number) {
    return this.http.put<void>(`${this.loansUrl}/${id}/return`, {});
  }

  getAllReservations() {
    return this.http.get<Reservation[]>(this.reservationsUrl);
  }
}
