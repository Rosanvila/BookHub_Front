import { inject, Injectable } from "@angular/core";
import { Reservation } from "../../shared/models/reservation.model";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";

@Injectable({ providedIn: 'root' })
export class ReservationsService {
    private http = inject(HttpClient);
    private readonly url = `${environment.apiUrl}/reservations`;

    getMyReservations() {
        return this.http.get<Reservation[]>(`${this.url}/me`);
    }

    reserve(bookId: number) {
        return this.http.post<Reservation>(`${this.url}`, { bookId });
    }

    cancel(id: number) {
        return this.http.delete(`${this.url}/${id}`);
    }
}