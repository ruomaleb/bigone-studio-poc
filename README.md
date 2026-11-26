# BigOne Studio

Prototype Nanotera : Pilotage, Préparation, Production et Administration.

- Application : https://ruomaleb.github.io/bigone-studio-poc/
- Version : **2026-11-26.7** — fiche de préparation du support, avec synthèse, liste de produits filtrable et consultation des fiches en modale.
- Identité et références : [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).
- Recette et limites : [docs/QA_REFONTE_20261116.md](docs/QA_REFONTE_20261116.md).

## Exécution

Application HTML/JavaScript sans compilation. Servir la racine avec un serveur HTTP, par exemple `python3 -m http.server 3000`. Conserver `index.html` et `assets/` ensemble. Diagramm, Gilmer et le logo sont locaux. La bibliothèque d'import XLSX existante reste chargée depuis son CDN.

Les données sont celles du prototype partagé. Garder le code de test hors du dépôt. Effectuer les essais d'écriture uniquement sur les jeux de test autorisés.

## Vérification

```sh
node tests/design-smoke.mjs
git diff --check
```

Compléter par la recette navigateur : quatre espaces, cinq onglets Préparation, formulaires, recherche et modes de Production, retour à la même opération, petit écran et clavier. Le test Node n'effectue aucune requête réseau.

## Publication existante

Version publiée avant cette évolution : **2026-11-16.2**, commit `bfdbaf6e768b38e7099cce29c0ffb22bcb8cc78f` sur `gh-pages`. GitHub Pages publie **`gh-pages`**, pas directement `main` (workflow dynamique `pages build and deployment`).

1. Relire et intégrer la branche de refonte dans `main`.
2. Reporter la version validée sur `gh-pages` par avance rapide ou fusion normale, sans forcer l'historique.
3. Attendre la réussite du déploiement Pages.
4. Vérifier l'URL publique, la version `2026-11-26.7` en pied de page, les polices, le logo et les routes profondes.

Retour arrière : revert explicite. Aucun changement de base, de droits serveur ou d'hébergement n'est nécessaire pour cette refonte.
