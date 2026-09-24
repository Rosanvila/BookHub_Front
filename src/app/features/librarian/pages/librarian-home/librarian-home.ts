import { Component, inject, signal, computed, afterNextRender, DestroyRef } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, of } from 'rxjs';
import { LibrarianService } from '../../librarian.service';
import { BookCoverComponent } from '../../../../shared/components/book-cover/book-cover';
import type { LibrarianLoan } from '../../../../shared/models/loan.model';
import type { Reservation } from '../../../../shared/models/reservation.model';
import type { Book, BookStatus } from '../../../../shared/models/book.model';

type LoanTab = 'all' | 'active' | 'late';

@Component({
  selector: 'app-librarian-home',
  imports: [BookCoverComponent, SlicePipe],
  templateUrl: './librarian-home.html',
  styleUrl: './librarian-home.css',
})
export class LibrarianHome {
  private librarianService = inject(LibrarianService);
  private destroyRef = inject(DestroyRef);

  readonly loading = signal(true);
  readonly allLoans = signal<LibrarianLoan[]>([]);
  readonly allReservations = signal<Reservation[]>([]);
  readonly activeTab = signal<LoanTab>('all');

  readonly activeLoans = computed(() =>
    this.allLoans().filter(l => l.statut === 'EN COURS' || l.statut === 'EN RETARD')
  );

  readonly filteredLoans = computed(() => {
    const tab = this.activeTab();
    const loans = this.activeLoans();
    if (tab === 'active') return loans.filter(l => l.statut === 'EN COURS');
    if (tab === 'late') return loans.filter(l => l.statut === 'EN RETARD');
    return loans;
  });

  readonly pendingReservations = computed(() =>
    this.allReservations().filter(r => r.status === 'EN_ATTENTE')
  );

  readonly statsLoansToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.allLoans().filter(l => l.dateEmprunt?.startsWith(today)).length;
  });

  readonly statsLate = computed(() =>
    this.allLoans().filter(l => l.statut === 'EN RETARD').length
  );

  readonly statsPending = computed(() =>
    this.allReservations().filter(r => r.status === 'EN_ATTENTE').length
  );

  readonly recentActivity = computed(() =>
    [...this.allLoans()]
      .sort((a, b) => new Date(b.dateEmprunt).getTime() - new Date(a.dateEmprunt).getTime())
      .slice(0, 5)
  );

  constructor() {
    afterNextRender(() => {
      forkJoin({
        loans: this.librarianService.getAllLoans().pipe(catchError(() => of([]))),
        reservations: this.librarianService.getAllReservations().pipe(catchError(() => of([]))),
      }).pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(({ loans, reservations }) => {
          this.allLoans.set(loans);
          this.allReservations.set(reservations);
          this.loading.set(false);
        });
    });
  }

  returnLoan(id: number): void {
    this.librarianService.returnLoan(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.allLoans.update(list =>
          list.map(l => l.id === id ? { ...l, statut: 'RENDU' as const } : l)
        );
      });
  }

  toLoanBook(loan: LibrarianLoan): Book {
    return {
      key: String(loan.id),
      title: loan.titre,
      author: loan.auteur,
      category: '',
      status: (loan.statut === 'EN RETARD' ? 'late' : 'borrowed') as BookStatus,
      coverUrl: loan.urlCouverture ?? undefined,
    };
  }

  toReservationBook(r: Reservation): Book {
    return {
      key: String(r.bookId),
      title: r.bookTitle,
      author: '-',
      category: '',
      status: 'available' as BookStatus,
      coverUrl: r.urlCouverture ?? undefined,
    };
  }

  userInitials(loan: LibrarianLoan): string {
    return `${loan.prenom?.[0] ?? ''}${loan.nom?.[0] ?? ''}`.toUpperCase() || '?';
  }

  userFullName(loan: LibrarianLoan): string {
    return `${loan.prenom ?? ''} ${loan.nom ?? ''}`.trim() || '–';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  formatShortDate(dateStr: string): string {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '–';
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  readonly today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}