export interface Loan {
  id: number;
  livreId: number;
  titre: string;
  auteur: string;
  urlCouverture: string;
  dateParution: string;
  dateEmprunt: string;
  dateRetourPrevue: string;
  statut: 'EN COURS' | 'RENDU' | 'EN RETARD';
}

export interface LibrarianLoan extends Loan {
  userId: number;
  nom: string;
  prenom: string;
}