import { Component, inject, signal, afterNextRender, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { BooksService } from '../../books.service';
import { IconComponent } from '../../../../shared/components/icon/icon';
import { ReserveButton } from '../../../../shared/components/button/reserve-button';
import { BorrowButton } from '../../../../shared/components/button/borrow-button';
import { BookCoverComponent } from '../../../../shared/components/book-cover/book-cover';
import type { BookDetail as BookDetailData, Book, BookStatus } from '../../../../shared/models/book.model';

@Component({
  selector: 'app-book-detail',
  imports: [RouterLink, IconComponent, ReserveButton, BorrowButton, BookCoverComponent],
  templateUrl: './book-detail.html',
  styleUrl: './book-detail.css',
})
export class BookDetail {
  private route        = inject(ActivatedRoute);
  private booksService = inject(BooksService);
  private destroyRef   = inject(DestroyRef);

  readonly loading = signal(true);
  readonly book    = signal<BookDetailData | null>(null);

  readonly year = computed(() => {
    const date = this.book()?.dateParution;
    return date ? new Date(date).getFullYear() : '';
  });

  readonly bookForCover = computed<Book | null>(() => {
    const b = this.book();
    if (!b) return null;
    return {
      key:      b.id.toString(),
      title:    b.titre,
      author:   b.auteur,
      category: b.categorie,
      status:   (b.exemplairesDisponibles > 0 ? 'available' : 'borrowed') as BookStatus,
      coverUrl: b.urlCouverture || undefined,
      year:     b.dateParution ? new Date(b.dateParution).getFullYear() : undefined,
    };
  });

  constructor() {
    afterNextRender(() => {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      this.booksService.getById(id).pipe(
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe(data => {
        this.book.set(data);
        this.loading.set(false);
      });
    });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}