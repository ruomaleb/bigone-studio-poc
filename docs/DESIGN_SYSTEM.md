# BigOne Studio — référence visuelle

16 novembre 2026. Refonte de l'interface 2026-11-15.2, sans changement du modèle de données.

## Sources relues

| Document fourni | Utilisation |
| --- | --- |
| `BigOne_Studio_Demarche_Claude_Design_20261104.pdf` | p. 3 : quatre espaces ; p. 5 : dossier enrichi ; p. 6–7 : captures ; p. 9 : identité ; p. 10 : continuité du dossier |
| `BigOne_Studio_Architecture_4_espaces.html` | Navigation, surfaces, onglets, panneaux et tableaux ; extraction du logo et des trois polices intégrées |
| `BigOne_Studio_5_pistes_UI.html` | Hiérarchie du dossier, composition des supports, contexte distinct de l'espace de travail |
| `BIGONE_DESIGN_SYSTEM.md`, 22 septembre 2026 | Relevé documentaire BigOne/OneShop de Zeroheight : typographies, boutons, Lin, focus et états |

Références du relevé : [introduction](https://zeroheight.com/843cb8e73/p/118bab-introduction), [couleurs](https://zeroheight.com/843cb8e73/p/32ccbc-colors), [typographies](https://zeroheight.com/843cb8e73/p/0015e9-typography), [boutons](https://zeroheight.com/843cb8e73/p/14a1b3). Leur consultation directe n'a pas abouti pendant l'intervention : les valeurs proviennent des documents et des maquettes fournis, pas d'une vérification de la documentation en ligne actuelle.

`BigOne_direction_01_iteration.html` est une exploration de communication commerciale, pas la référence des composants de Studio.

## Valeurs et adaptations

| Élément | Application |
| --- | --- |
| Titres | Diagramm gras. H1 24/36 px, H3 16/24 px |
| Interface | Gilmer regular et bold originaux. Texte 14/24 px, boutons 14/21 px, petites légendes 11–12 px |
| Encre | `#111721` |
| Surfaces | Blanc `#FFFFFF`, Lin `#F5F5FB` |
| Séparateurs | `#E6E6EC` du HTML ; le brief arrondit à `#E6E6E6` |
| Texte secondaire | `#626571` |
| Cobalt | `#033FE2` : liens, focus, information |
| Violet | Accent `#8552F6`, petits textes `#7440DD` comme dans la maquette HTML, fond `#F4F0FF` |
| Boutons principaux | Fond noir, texte blanc, hauteur 40 px, rayon 4 px, marge intérieure horizontale 12 px. Cible tactile 44 px sur mobile |
| Statuts | Vert `#236842` / `#EAF5ED`, orange `#994D0C` / `#FFF4E6`, rouge `#B42336` / `#FFF0F2`, avec libellés |
| Composants | Bordures fines, arrondis 6–8 px ; ombre limitée aux modales et notifications |
| Icônes | SVG simples cohérents avec les repères des maquettes, sans framework ajouté |
| Thème | Clair explicite ; aucune bascule vers l'ancien thème cyan sombre |

Le violet de texte présente un contraste de 5,97:1 sur blanc et 5,33:1 sur violet pâle. Les dix couples de texte principaux testés dépassent 4,5:1. Ce contrôle ciblé n'est pas une certification d'accessibilité complète.

## Architecture

- **Pilotage** présente un accueil unique. Le planning est dans un bloc replié par défaut, dépliable sur place, avant la liste des opérations. Les onglets Vue d’ensemble / Plan de commerce ont été retirés. `#pilotage` ouvre ce même accueil avec le bloc déplié, puis normalise l’adresse en `#accueil`.

Cette correction reprend la précision explicite d’Arnaud du 16 novembre 2026. Les fichiers HTML de conception retrouvés ne montrent pas ce bloc ; ils ne permettent donc pas, à eux seuls, d’affirmer une correspondance exhaustive avec sa maquette de référence. Le planning reste ouvert ou fermé selon le choix de l’utilisateur pendant les actualisations et la navigation ; un chargement neuf de l’accueil le replie.
- **Préparation** conserve Cadrage, Offres, Magasins, Dispositif, Calendrier. L'opération devient le titre principal ; le panneau de contexte reprend réseau, dates, responsable et volumes.
- **Production** conserve listes, colonnes, filtres, créations, contrôles, révisions, paquet Media, bilan et journal. Le retour à Préparation conserve le même identifiant d'opération.
- **Administration** revient à droite. Les magasins, familles et modèles de jalons sont lus depuis les référentiels existants. Les droits et connexions sont explicités sans simuler une gestion d'équipes ou une synchronisation inexistantes.

Les offres occupent toute la largeur pour les tableaux. Les autres onglets de préparation utilisent le panneau latéral. Sur mobile, le panneau passe après le contenu, les tableaux larges défilent dans leur conteneur et la liste de production devient verticale.

Les traitements d'écriture, authentification, validation, import, versionnage, snapshots et paquet Media ne sont pas remplacés. Les anomalies fonctionnelles de l'audit du 15 novembre ne sont pas annoncées comme corrigées. Les cinq pistes exploratoires renseignent le langage visuel ; elles ne constituent pas cinq nouveaux modes métier. Aucune modification de base ni connexion externe n'a été réalisée.


## Référence DSP du 25 novembre 2026

Le Dashboard et l’écran Opérations de BigOne Media servent de référence aux titres, boutons, filtres et états de navigation. Studio utilise les fichiers Diagramm et Gilmer embarqués. Les composants nécessaires à la production du PAC conservent leur comportement métier.

## Panneaux de travail du 26 novembre 2026

La barre horizontale donne accès aux espaces Studio. Le menu de gauche reprend le principe observé dans le Dashboard et la liste Opérations de BigOne Media. Il contient les raccourcis de pilotage ou les rubriques du dossier. Sur petit écran, les rubriques du dossier passent sous son titre. Les panneaux blancs se détachent du fond gris bleuté. La sélection est violette, les pictogrammes de section associent violet et cobalt et les actions principales restent sombres. Les trois illustrations de l’accueil représentent des familles de contenus. Les fichiers des opérations sont identifiés par leur nom et leur révision.
