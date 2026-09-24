import { Component, inject, signal, afterNextRender, DestroyRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { ReservationsService } from '../reservations.service';
import type { Reservation } from '../../../shared/models/reservation.model';

@Component({
    selector: "app-my-reservations",
    imports: [RouterLink],
    templateUrl: "./my-reservations.html",
    styleUrl: "./my-reservations.css",
})
export class MyReservationsPage {
    private reservationsService = inject(ReservationsService);
    private destroyRef = inject(DestroyRef)

    readonly loading = signal(true);
    readonly reservations = signal<Reservation[]>([]);
    readonly cancelling = signal<number | null>(null);
    readonly errorMsg = signal<string | null>(null);

    constructor() {
        afterNextRender(() => {
            this.reservationsService.getMyReservations().pipe(
                catchError(() => of([] as Reservation[])),
                takeUntilDestroyed(this.destroyRef),
            ).subscribe(data => {
                this.reservations.set(data);
                this.loading.set(false);
            });
        });
    }

    canCancel(reservation: Reservation): boolean {
        return reservation.status === 'EN_ATTENTE' || reservation.status === 'DISPONIBLE';
    }

    cancel(reservation: Reservation): void {
        if (this.cancelling() !== null || !this.canCancel(reservation)) return;
        this.cancelling.set(reservation.id);
        this.errorMsg.set(null);

        this.reservationsService.cancel(reservation.id).subscribe({
            next: () => {
                this.reservations.update(list =>
                    list.map(r => r.id === reservation.id ? { ...r, status: 'ANNULEE' } : r)
                );
                this.cancelling.set(null);
            },
            error: () => {
                this.errorMsg.set("L'annulation a échoué.");
                this.cancelling.set(null);
            },
        });
    }
}
