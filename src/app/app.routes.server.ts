import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // La fiche livre dépend d'un identifiant issu de la base : la liste des
    // pages ne peut pas être connue au moment de la construction. Le rendu se
    // fait donc à la demande côté serveur, et non par pré-rendu.
    path: 'book/:id',
    renderMode: RenderMode.Server
  },
  {
    // Écrans dépendant de l'utilisateur connecté : leur contenu n'a de sens
    // qu'une fois le jeton d'authentification disponible côté navigateur.
    path: 'home',
    renderMode: RenderMode.Client
  },
  {
    path: 'loans',
    renderMode: RenderMode.Client
  },
  {
    path: 'librarian-catalog',
    renderMode: RenderMode.Client
  },
  {
    // Pages publiques et statiques : le pré-rendu reste le plus performant.
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
