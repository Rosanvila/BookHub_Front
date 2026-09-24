import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpErrorResponse } from "@angular/common/http";
import { of, throwError } from "rxjs";
import { vi } from "vitest";

import { BorrowButton } from "./borrow-button";
import { LoansService } from "../../../features/loans/loans.service";
import type { Loan } from "../../models/loan.model";

/**
 * Fabrique un emprunt minimal : seuls le livre et le statut interviennent
 * dans la logique du bouton, les autres champs satisfont le type.
 */
function loan(livreId: number, statut: Loan["statut"]): Loan {
  return {
    id: 1,
    livreId,
    titre: "Clean Code",
    auteur: "Robert C. Martin",
    urlCouverture: "",
    dateParution: "2008-08-01",
    dateEmprunt: "2026-01-01",
    dateRetourPrevue: "2026-01-15",
    statut,
  };
}

describe("BorrowButton", () => {
  let fixture: ComponentFixture<BorrowButton>;
  let component: BorrowButton;
  let serviceStub: {
    hasActiveLoanOn: ReturnType<typeof vi.fn>;
    borrow: ReturnType<typeof vi.fn>;
  };

  async function setUp(alreadyBorrowed = false) {
    serviceStub = {
      hasActiveLoanOn: vi.fn().mockReturnValue(of(alreadyBorrowed)),
      borrow: vi.fn().mockReturnValue(of(loan(42, "EN COURS"))),
    };

    await TestBed.configureTestingModule({
      imports: [BorrowButton],
      providers: [{ provide: LoansService, useValue: serviceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(BorrowButton);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("bookId", 42);
    await fixture.whenStable();
  }

  it("enregistre l'emprunt et passe en état « emprunté »", async () => {
    await setUp();

    component.borrow();

    expect(serviceStub.borrow).toHaveBeenCalledWith(42);
    expect(component.done()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it("passe en état « déjà emprunté » lorsqu'un emprunt en cours existe", async () => {
    await setUp(true);

    expect(component.alreadyBorrowed()).toBe(true);
  });

  it("laisse le bouton actif quand le service ne signale aucun emprunt", async () => {
    await setUp(false);

    expect(component.alreadyBorrowed()).toBe(false);
  });

  it("n'appelle pas l'API lorsque le livre est déjà emprunté", async () => {
    await setUp(true);

    component.borrow();

    expect(serviceStub.borrow).not.toHaveBeenCalled();
  });

  it("affiche le message métier renvoyé par l'API en cas de refus", async () => {
    await setUp();
    serviceStub.borrow.mockReturnValue(
      throwError(() => new HttpErrorResponse({
        status: 500,
        error: { error: "Max 3 emprunts atteints" },
      })),
    );

    component.borrow();

    expect(component.done()).toBe(false);
    expect(component.errorMsg()).toContain("Max 3 emprunts atteints");
  });

  it("affiche un message générique si l'API ne précise rien", async () => {
    await setUp();
    serviceStub.borrow.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );

    component.borrow();

    expect(component.errorMsg()).toBe("L'emprunt a échoué.");
  });
});
