# BigOne Studio — continuité

Avant toute modification visuelle, lire `docs/DESIGN_SYSTEM.md` et consulter les maquettes citées. Le design BigOne est une contrainte, pas une invitation à choisir une nouvelle direction graphique.

- Diagramm pour les titres, Gilmer pour l'interface, logo fourni dans `assets/`.
- Accueil : planning dans un bloc replié par défaut, dépliable sur place ; pas de sous-navigation vers une page Plan de commerce. `#pilotage` reste un lien compatible vers ce même accueil avec planning ouvert.
- Navigation horizontale : Pilotage, Préparation, Produits, Production ; Administration du réseau dans le menu de gauche. La mécanique du dossier se règle depuis le menu en haut à droite.
- Blanc, Lin, encre et boutons principaux sombres. Cobalt pour l'interaction ; violet pour les repères. Pas de rail cyan sombre ni de magenta.
- Conserver l'identité d'opération entre Préparation et Production, les URL profondes, les actions et les contrôles métier.
- Ne pas présenter un connecteur comme effectif s'il ne l'est pas. Les référentiels d'Administration sont actuellement en consultation.
- Centraliser les styles dans `assets/studio.css` ; ne pas superposer un autre thème.
- Tester les écrans modifiés dans le navigateur, dont le petit écran, et lancer `node tests/design-smoke.mjs`.
- Lire `README.md` avant publication : le déploiement existant utilise `gh-pages`.
