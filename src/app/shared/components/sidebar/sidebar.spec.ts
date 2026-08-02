import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { of } from "rxjs";
import { vi } from "vitest";

import { SidebarComponent } from "./sidebar";
import { AuthService } from "../../../core/auth/auth.service";
import { LoansService } from "../../../features/loans/loans.service";

describe("SidebarComponent", () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  /**
   * Monte le menu pour un rôle donné. L'utilisateur connecté est simulé, ce qui
   * permet de vérifier le filtrage sans dépendre d'une authentification réelle.
   */
  async function setUpWithRole(role: string) {
    // Permet d'appeler cette fonction plusieurs fois dans un même test, afin de
    // comparer directement le rendu obtenu pour deux rôles différents.
    TestBed.resetTestingModule();

    const authStub = {
      currentUser: signal({ prenom: "Lucie", nom: "Bernard", role }),
      displayName: signal("Lucie Bernard"),
      initials: signal("LB"),
      memberSinceLabel: signal("Membre depuis 2026"),
    };

    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: LoansService, useValue: { getMyLoans: vi.fn().mockReturnValue(of([])) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  }

  /** Raccourci de lecture : les libellés des entrées effectivement affichées. */
  function visibleLabels(): string[] {
    return component.navItems().map((item) => item.label);
  }

  it("propose au membre le catalogue et ses emprunts", async () => {
    await setUpWithRole("UTILISATEUR");

    expect(visibleLabels()).toContain("Catalogue");
    expect(visibleLabels()).toContain("Mes emprunts");
  });

  it("masque la gestion du catalogue pour un membre", async () => {
    await setUpWithRole("UTILISATEUR");

    expect(visibleLabels()).not.toContain("Gestion catalogue");
  });

  it("propose la gestion du catalogue au bibliothécaire", async () => {
    await setUpWithRole("LIBRAIRE");

    expect(visibleLabels()).toContain("Gestion catalogue");
  });

  it("masque au bibliothécaire les entrées réservées aux lecteurs", async () => {
    await setUpWithRole("LIBRAIRE");

    // Le bibliothécaire n'emprunte pas depuis cette interface : lui présenter
    // « Mes emprunts » ou le catalogue public n'aurait pas de sens.
    expect(visibleLabels()).not.toContain("Catalogue");
    expect(visibleLabels()).not.toContain("Mes emprunts");
  });

  it("conserve l'accueil quel que soit le rôle", async () => {
    await setUpWithRole("UTILISATEUR");
    expect(visibleLabels()).toContain("Accueil");

    await setUpWithRole("LIBRAIRE");
    expect(visibleLabels()).toContain("Accueil");
  });
});
