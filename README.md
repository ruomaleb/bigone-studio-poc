# BigOne Studio

Prototype Nanotera : Pilotage, Préparation, Production et Administration.

- Application : https://ruomaleb.github.io/bigone-studio-poc/
- Version **2026-11-28.8**. Dans Pilotage → Créer une opération, sélectionner le réseau Nanotera et le modèle **Brico-déco · démonstration Nanotera**. Le nouveau dossier contient les versions restreinte, classique et large et six magasins fictifs. Dans Participants, ouvrir les engagements puis charger les réponses de démonstration pour consulter par magasin la version retenue, les exemplaires du tract, les kits PLV et le pack digital. Pour la version classique, compléter le conditionnement de Gaia, placer la lampe dans l’E-catalogue, valider le BAT et déposer le CSV Bonial en recette. Studio affiche le reçu de test dans la fiche du flux.
- Version **2026-11-28.6**. La matrice de flux par version et destination ouvre les contrôles et les éditions territoriales. L’administration réseau se trouve dans le menu latéral. Les réglages de la mécanique sont accessibles en haut à droite du dossier.
- Version **2026-11-28.5**. Production → Flux ouvre le suivi E-catalogue, Bonial et Tiendeo dans le dossier partagé Brico-déco, avec les contrôles et reçus du dossier.
- Version **2026-11-28.4**. Les pages du catalogue et des dossiers s’alignent sous le bandeau. Le menu latéral reprend le panneau compact de BigOne Media.
- Version **2026-11-28.3**. Le menu de gauche accompagne le choix d’opération, les dossiers et l’administration. Sur mobile, les icônes restent accessibles. Le chemin de fer et les BAT proposent un plein écran avec retour par le bouton ou la touche Échap.
- Version **2026-11-28.2**. Les entrées Produits, Production et Supports demandent d’abord une opération. L’adresse et la navigation entre Produits et Production conservent le dossier sélectionné. Les flux, les filtres et les révisions s’appliquent à ce dossier.
- Version **2026-11-28.1**. [Ouvrir le pilote Nanotera](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco&parcours=production) et [consulter les flux](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco&parcours=production#flux?vue=reseau). Chaque navigateur dispose d’une copie Brico-déco isolée avec six magasins témoins. Les invitations magasin et relecteur donnent accès à cette même copie.
- Version **2026-11-27.8**. [Ouvrir la démo Brico-déco avec Assistant](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco&assistant=1). Les 21 offres Nanotera sont reliées aux pages du catalogue original. Le dossier partagé est accessible au Responsable depuis une opération.
- [Chemin de fer](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco#production?id=bd-ecatalogue&atelier=fer&page=2) et [BAT collaboratif](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco#production?id=bd-ecatalogue&atelier=bat&page=2). Le chutier, la composition et la relecture utilisent le même dossier.
- [Catalogue de produits](https://ruomaleb.github.io/bigone-studio-poc/#contenus--produits) · fiche commune à deux onglets avec galerie d’images, de logos et de vidéos.
- [Proposition par groupe sur les 900 magasins fictifs Nanotera](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco#configurer). Sélection de la version, aperçu de l’assortiment, ciblage par format, région et type de zone.
- [Feuille de route et critères d’acceptation des cinq lots](docs/FEUILLE_DE_ROUTE_STUDIO.md).
- [Fonctionnement, publication et reprise du dossier d’opération](docs/DOSSIER_OPERATION.md).
- Version précédente : **2026-11-26.8** — atelier de consultation et de personnalisation des supports. Deux modèles Studio, sélections privées multipages, import d’images, personnalisation par bandeau et export PNG. Les visuels et les maquettes associés à une révision sont conservés en IndexedDB sur l’appareil. Le fichier de production et les BAT suivent leur circuit habituel.
- Identité et références : [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- Recette et limites : [docs/QA_REFONTE_20261116.md](docs/QA_REFONTE_20261116.md).

## Exécution

Application HTML/JavaScript sans compilation. Servir la racine avec un serveur HTTP, par exemple `python3 -m http.server 3000`. Conserver `index.html` et `assets/` ensemble. Diagramm, Gilmer et le logo sont locaux. La bibliothèque d'import XLSX existante reste chargée depuis son CDN.

Les données sont celles du prototype partagé. Garder le code de test hors du dépôt. Effectuer les essais d'écriture uniquement sur les jeux de test autorisés.

## Vérification

```sh
node tests/design-smoke.mjs
node tests/operation.mjs
git diff --check
```

Compléter par la recette navigateur : quatre espaces, cinq onglets Préparation, formulaires, recherche et modes de Production, retour à la même opération, petit écran et clavier. Les tests locaux utilisent SQLite en mémoire. La recette de navigation est exécutable avec Playwright et Chromium via `node tests/operation-interface.cjs`.

## Publication existante

Version publiée avant cette évolution : **2026-11-16.2**, commit `bfdbaf6e768b38e7099cce29c0ffb22bcb8cc78f` sur `gh-pages`. GitHub Pages publie **`gh-pages`**, pas directement `main` (workflow dynamique `pages build and deployment`).

1. Relire et intégrer la branche de refonte dans `main`.
2. Reporter la version validée sur `gh-pages` par avance rapide ou fusion normale, sans forcer l'historique.
3. Attendre la réussite du déploiement Pages.
4. Vérifier l'URL publique, la version publiée en pied de page et sur `/health` côté Worker, les polices, le logo et les routes profondes.

Retour arrière : revert explicite. Les modalités de reprise pour le service du dossier et les données des essais figurent dans la note de publication.
