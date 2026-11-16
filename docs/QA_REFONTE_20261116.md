# Recette de la refonte

Version préparée : **2026-11-16.1**. Base : `3a9dbf969ca152e1503d1ddb35c1b62b5999969f`.

## Environnement

Recette navigateur sur un aperçu HTTP de la source modifiée, avec les données publiques du prototype. Dans la seule copie d'aperçu, écritures et RPC sont neutralisés. Les formulaires s'ouvrent pour contrôle visuel, sans envoyer d'enregistrement. Ces neutralisations ne sont pas présentes dans `index.html` livré.

## Résultats

| Contrôle | Résultat |
| --- | --- |
| Syntaxe | `node --check` réussi |
| Test hors réseau | `node tests/design-smoke.mjs` réussi : cinq onglets, continuité du dossier, quatre rubriques Administration, routes inconnues, états vides, échappement |
| Actifs | Logo, Gilmer regular/bold et Diagramm locaux ; aucun appel Google Fonts |
| Contrastes | Dix couples principaux, minimum 5,33:1 ; statuts avec texte |
| Vue d'ensemble | Quatre espaces horizontaux, indicateurs et opérations partagées rendus |
| Continuité | « Les prix bas de la semaine S49 », Préparation → Production, conservation de `u-2649-pbs` |
| Cadrage | Brief et contexte ; formulaire ouvert puis annulé |
| Rechargement | Depuis Administration, rechargement puis retour à Préparation : opération `u-2649-pbs` conservée ; correction du contexte prématurément vidé pendant le chargement |
| Offres | 14 offres rendues, document sans débordement horizontal desktop |
| Engagements | Dix sélecteurs d'engagement rendus pour les magasins du réseau de démonstration |
| Calendrier | Six supports et dix jalons généraux hérités rendus |
| Dispositif | Six supports et leurs actions, avec panneau d'opération |
| Production | Liste ; recherche « Meta » puis Colonnes : un résultat |
| Magasins / Administration | 16 magasins ; filtre « Réseau QA CX 1511 » : 3 lignes |
| Modèles / Administration | 10 types de supports et modèles de jalons |
| Connexions | Données et limites Media/BOSS explicites |
| Mobile | Cadre 390 px, zone utile 375 px avec barre de défilement ; document sans débordement en Cadrage et Production |
| Tablette | Cadre 768 px, zone utile 753 px ; document sans débordement en Production |

## Limites

Cette recette visuelle et de navigation ne revalide pas les écritures serveur, droits, snapshots ni tous les scénarios de l'audit précédent. Le mobile utilise un cadre de navigateur, pas un téléphone physique.

## Publication

La publication est autorisée par Arnaud le 16 novembre 2026. Le connecteur GitHub a refusé l'écriture (`403 Resource not accessible by integration`) ; la reprise utilise donc l'interface GitHub, avec la session du propriétaire du dépôt.

Le site est servi par la branche `gh-pages`. La vérification finale doit porter sur l'URL publique https://ruomaleb.github.io/bigone-studio-poc/ et sur le numéro **2026-11-16.1**, après réussite de l'action Pages. Le transfert du code dans `main` seul ne constitue pas une publication.

Le compte rendu ci-dessus décrit la recette préalable. Le statut du déploiement et son commit sont consultables dans les Actions GitHub.

## Correction du planning — 2026-11-16.2

Demande explicite d'Arnaud : le planning appartient à l'accueil, dans un bloc replié. La version précédente avait ajouté une vue séparée « Plan de commerce » ; cette navigation est supprimée.

Le bloc natif `details` « Planning des opérations » est placé après les indicateurs et avant les opérations suivies. Il est fermé au chargement de l'accueil. Son ouverture affiche sur place la frise, les jalons des dossiers et le référentiel des opérations. L'état choisi reste conservé pendant les actualisations et les changements de vue de la session. Un rechargement de l'accueil rétablit l'état fermé. L'ancien lien `#pilotage` ouvre ce bloc dans l'accueil puis normalise l'adresse en `#accueil`.

| Contrôle sur l'aperçu de la source modifiée | Résultat |
| --- | --- |
| Syntaxe JavaScript, `git diff --check` et test hors réseau | Réussis |
| Arrivée sur l'accueil | Bloc fermé ; compteur de 19 opérations issues des données du prototype |
| Ancienne sous-navigation | Absente |
| Ouverture à la souris | Frise et détail affichés dans l'accueil |
| Administration → Pilotage après ouverture | Bloc toujours ouvert après le nouveau rendu |
| Touche Entrée sur le résumé | Fermeture fonctionnelle |
| Ancien lien `#pilotage` | Redirection vers `#accueil`, bloc ouvert |
| Rechargement de `#accueil` | Bloc fermé |
| Cadre mobile de 390 px, bloc ouvert et fermé | Largeur utile 375 px ; largeur du document 375 px, sans débordement horizontal |

La vérification avant publication utilise le même aperçu sans écritures que la recette initiale. Les maquettes HTML récupérées ne montrent pas ce mécanisme de planning : la correction s'appuie donc sur la précision explicite d'Arnaud. Cette recette ne certifie pas une conformité exhaustive de tous les écrans à l'ensemble des maquettes originales.

Publication visée : version **2026-11-16.2** sur l'URL publique, après fusion dans `main`, puis dans `gh-pages` et réussite de l'action Pages. La fusion dans `main` seule ne suffit pas.
