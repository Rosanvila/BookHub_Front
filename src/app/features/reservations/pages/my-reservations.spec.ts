import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

import { MyReservationsPage } from "./my-reservations";
import { ReservationsService } from "../reservations.service";
import type { Reservation } from "../../../shared/models/reservation.model";

function reservation(id: number, status: string, rang = 1): Reservation {
  return {
    id,
    userId: 1,
    userName: "Lucie Bernard",
    bookId: 42,
    urlCouverture: null,
    bookTitle: "Clean Code",
    reservationDate: "2026-01-01",
    rankWaitingList: rang,
    status,
  };
}

describe("MyReservationsPage", () => {
  let fixture: ComponentFixture<MyReservationsPage>;
  let component: MyReservationsPage;
  let serviceStub: {
    getMyReservations: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };

  async function setUp(existing: Reservation[]) {
    serviceStub = {
      getMyReservations: vi.fn().mockReturnValue(of(existing)),
      cancel: vi.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [MyReservationsPage],
      providers: [
        provideRouter([]),
        { provide: ReservationsService, useValue: serviceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyReservationsPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  it("autorise l'annulation d'une réservation en attente", async () => {
    await setUp([reservation(1, "EN_ATTENTE")]);

    expect(component.canCancel(reservation(1, "EN_ATTENTE"))).toBe(true);
  });

  it("autorise l'annulation d'une réservation mise à disposition", async () => {
    // US-RESA-02 : l'adhérent prévenu peut se désister
    await setUp([reservation(1, "DISPONIBLE")]);

    expect(component.canCancel(reservation(1, "DISPONIBLE"))).toBe(true);
  });

  it("n'autorise pas l'annulation d'une réservation déjà annulée", async () => {
    await setUp([reservation(1, "ANNULEE")]);

    expect(component.canCancel(reservation(1, "ANNULEE"))).toBe(false);
  });

  it("bascule la réservation en annulée après confirmation du serveur", async () => {
    await setUp([reservation(1, "EN_ATTENTE")]);

    component.cancel(reservation(1, "EN_ATTENTE"));

    expect(serviceStub.cancel).toHaveBeenCalledWith(1);
    expect(component.reservations()[0].status).toBe("ANNULEE");
    expect(component.cancelling()).toBeNull();
  });

  it("affiche un message si l'annulation échoue et conserve le statut", async () => {
    await setUp([reservation(1, "EN_ATTENTE")]);
    serviceStub.cancel.mockReturnValue(throwError(() => new Error("500")));

    component.cancel(reservation(1, "EN_ATTENTE"));

    expect(component.errorMsg()).toBe("L'annulation a échoué.");
    expect(component.reservations()[0].status).toBe("EN_ATTENTE");
  });
});
