import { Component, input, inject, signal, afterNextRender, DestroyRef } from "@angular/core";
import { IconComponent } from '../icon/icon';
import { LoansService } from "../../../features/loans/loans.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
    selector: 'app-borrow-button',
    standalone: true,
    imports: [IconComponent],
    templateUrl: './borrow-button.html',
    styleUrl: './borrow-button.css',
})
export class BorrowButton {
    bookId = input.required<number>();

    private loansService = inject(LoansService);
    private destroyRef = inject(DestroyRef);

    readonly loading = signal(false);
    readonly done = signal(false);
    readonly alreadyBorrowed = signal(false);
    readonly errorMsg = signal<string | null>(null);

    constructor() {
        afterNextRender(() => {
            this.loansService.hasActiveLoanOn(this.bookId())
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (active) => this.alreadyBorrowed.set(active),
                });
        });
    }

    borrow() {
        if (this.loading() || this.done() || this.alreadyBorrowed()) return;
        this.loading.set(true);
        this.errorMsg.set(null);
        this.loansService.borrow(this.bookId()).subscribe({
            next: () => {
                this.done.set(true);
                this.loading.set(false);
            },
            error: (err: HttpErrorResponse) => {
                this.errorMsg.set(err.error?.error ?? "L'emprunt a échoué.");
                this.loading.set(false);
            },
        });
    }
}
