import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

import { ReserveButton } from "./reserve-button";
import { ReservationsService } from "../../../features/reservations/reservations.service";
import { LoansService } from "../../../features/loans/loans.service";
import type { Reservation } from "../../models/reservation.model";

/**
 * Fabrique une réservation minimale : seuls le livre et le statut interviennent
 * dans la logique du bouton, les autres champs sont remplis pour satisfaire le type.
 */
function reservation(bookId: number, status: string): Reservation {
  return {
    id: 1,
    userId: 1,
    userName: "Lucie Bernard",
    bookId,
    urlCouverture: null,
    bookTitle: "Clean Code",
    reservationDate: "2026-01-01",
    rankWaitingList: 1,
    status,
  };
}

describe("ReserveButton", () => {
  let fixture: ComponentFixture<ReserveButton>;
  let component: ReserveButton;
  let serviceStub: {
    getMyReservations: ReturnType<typeof vi.fn>;
    reserve: ReturnType<typeof vi.fn>;
  };
  let loansStub: { hasActiveLoanOn: ReturnType<typeof vi.fn> };

  /**
   * Monte le composant avec un service simulé. Aucun appel réseau n'est émis :
   * les réponses de l'API sont décidées test par test.
   */
  async function setUp(options: { existing?: Reservation[]; bookId?: number; borrowed?: boolean }) {
    serviceStub = {
      getMyReservations: vi.fn().mockReturnValue(of(options.existing ?? [])),
      reserve: vi.fn().mockReturnValue(of(reservation(options.bookId ?? 42, "EN_ATTENTE"))),
    };
    loansStub = { hasActiveLoanOn: vi.fn().mockReturnValue(of(options.borrowed ?? false)) };

    await TestBed.configureTestingModule({
      imports: [ReserveButton],
      providers: [
        { provide: ReservationsService, useValue: serviceStub },
        { provide: LoansService, useValue: loansStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReserveButton);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("bookId", options.bookId ?? 42);
    await fixture.whenStable();
  }

  it("passe en état « déjà réservé » lorsqu'une réservation existe pour ce livre", async () => {
    await setUp({ existing: [reservation(42, "EN_ATTENTE")], bookId: 42 });

    expect(component.done()).toBe(true);
  });

  it("ignore une réservation annulée et laisse le bouton actif", async () => {
    await setUp({ existing: [reservation(42, "ANNULEE")], bookId: 42 });

    expect(component.done()).toBe(false);
  });

  it("interprète un conflit HTTP 409 comme une réservation déjà existante", async () => {
    await setUp({ bookId: 42 });
    serviceStub.reserve.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409 })),
    );

    component.reserve();

    // Le serveur signale que la réservation existe déjà : ce n'est pas une erreur
    // à afficher, mais l'état final attendu par l'utilisateur.
    expect(component.done()).toBe(true);
    expect(component.errorMsg()).toBeNull();
    expect(component.loading()).toBe(false);
  });

  it("affiche le message renvoyé par l'API en cas de refus", async () => {
    await setUp({ bookId: 42 });
    serviceStub.reserve.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 400,
        error: { error: "Ce livre est disponible, empruntez-le directement" },
      })),
    );

    component.reserve();

    expect(component.done()).toBe(false);
    expect(component.errorMsg()).toContain("empruntez-le directement");
  });

  it("n'appelle pas l'API une seconde fois lorsque la réservation est déjà posée", async () => {
    await setUp({ existing: [reservation(42, "EN_ATTENTE")], bookId: 42 });

    component.reserve();

    expect(component.done()).toBe(true);
    expect(serviceStub.reserve).not.toHaveBeenCalled();
  });

  it("passe en état « déjà emprunté » lorsque le lecteur détient l'exemplaire", async () => {
    // Le dernier exemplaire est sorti par ce lecteur : le réserver n'aurait aucun sens
    await setUp({ bookId: 42, borrowed: true });

    expect(component.alreadyBorrowed()).toBe(true);
  });

  it("laisse le bouton actif quand le service ne signale aucun emprunt", async () => {
    await setUp({ bookId: 42, borrowed: false });

    expect(component.alreadyBorrowed()).toBe(false);
  });

  it("n'appelle pas l'API de réservation si le livre est déjà emprunté", async () => {
    await setUp({ bookId: 42, borrowed: true });

    component.reserve();

    expect(serviceStub.reserve).not.toHaveBeenCalled();
  });
});
