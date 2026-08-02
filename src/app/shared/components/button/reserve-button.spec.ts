import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

import { ReserveButton } from "./reserve-button";
import { ReservationsService } from "../../../features/reservations/reservations.service";
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

  /**
   * Monte le composant avec un service simulé. Aucun appel réseau n'est émis :
   * les réponses de l'API sont décidées test par test.
   */
  async function setUp(options: {
    existing?: Reservation[];
    bookId?: number;
    disponibles?: number;
  }) {
    serviceStub = {
      getMyReservations: vi.fn().mockReturnValue(of(options.existing ?? [])),
      reserve: vi.fn().mockReturnValue(of(reservation(options.bookId ?? 42, "EN_ATTENTE"))),
    };

    await TestBed.configureTestingModule({
      imports: [ReserveButton],
      providers: [{ provide: ReservationsService, useValue: serviceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReserveButton);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("bookId", options.bookId ?? 42);
    fixture.componentRef.setInput("exemplairesDisponibles", options.disponibles ?? 3);
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

  it("affiche un message explicite lorsque le plafond d'emprunts est atteint", async () => {
    await setUp({ bookId: 42 });
    serviceStub.reserve.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 400 })),
    );

    component.reserve();

    expect(component.done()).toBe(false);
    expect(component.errorMsg()).toContain("maximum de 3 emprunts");
  });

  it("n'appelle pas l'API lorsqu'aucun exemplaire n'est disponible", async () => {
    await setUp({ bookId: 42, disponibles: 0 });

    component.reserve();

    expect(component.noStock()).toBe(true);
    expect(serviceStub.reserve).not.toHaveBeenCalled();
  });
});
