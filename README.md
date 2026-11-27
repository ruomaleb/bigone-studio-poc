# BigOne Studio

Prototype Nanotera : Pilotage, Préparation, Production et Administration.

- Application : https://ruomaleb.github.io/bigone-studio-poc/
- Version **2026-11-27.4**. [Ouvrir le dossier S49 avec Assistant](https://ruomaleb.github.io/bigone-studio-poc/operation/?assistant=1). Le bouton « Essayer le dossier S49 » de l’accueil ouvre un essai indépendant. Le dossier partagé est accessible au Responsable depuis une opération.
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
4. Vérifier l'URL publique, la version `2026-11-27.4` en pied de page, les polices, le logo et les routes profondes.

Retour arrière : revert explicite. Les modalités de reprise pour le service du dossier et les données des essais figurent dans la note de publication.
