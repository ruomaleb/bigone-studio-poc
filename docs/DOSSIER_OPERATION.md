# Dossier d’opération et assistant Studio

## Accès

Le [dossier Brico-déco avec Assistant](https://ruomaleb.github.io/bigone-studio-poc/operation/?assistant=1) ouvre un espace d’essai individuel conservé sur le serveur. La clé d’accès reste dans le navigateur. Participants → Accès magasin génère un lien individuel. Ce lien donne accès à la réponse de ce seul magasin sur un autre appareil. L’URL de l’essai seule ouvre un espace indépendant dans un autre navigateur. La durée de validité des accès est de 60 jours.

Les six rubriques sont Informations, Participants et Supports en Préparation, Produits dans le PIM, puis Supports et Flux en Production. Informations contient le rétroplanning. Le tiroir Assistant propose des questions, une saisie libre et des liens vers les fiches. L’historique de conversation est local à chaque navigateur et à chaque rôle.

## Catalogue de démonstration

Le [dossier Brico-déco](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco&assistant=1) est le point d’entrée de la démonstration. Le [catalogue Nanotera Levallois](https://ruomaleb.github.io/bigone-studio-poc/assets/brico-deco/catalogue.pdf) présente l’offre du 19 au 26 novembre 2022. Le calendrier de simulation va du 19 janvier au 1er février 2027.

Les 21 fiches PIM reprennent les références existantes. Les pages 2, 3, 4 et 5 en regroupent respectivement 5, 5, 4 et 7. Chaque fiche montre la photographie extraite du catalogue. Son onglet « Supports associés » ouvre la page correspondante en Production. Les prix des fiches sont modifiables dans la copie d’essai. Le PDF conserve les prix imprimés.

Pour illustrer le ciblage du réseau fictif de 900 points de vente, les supermarchés reçoivent la version V1 « Luminaires et miroirs » (17 références), les hypermarchés la V2 « Catalogue intégral » (21) et les supérettes la V3 « Ampoules LED » (4). Ces assortiments et le flux d’export sont des choix de démonstration. Les groupes se modifient dans Participants.

## Chemin de fer et BAT collaboratif

Dans Brico-déco, [ouvrir la mise en page](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco#production?id=bd-ecatalogue&atelier=fer&page=2) affiche les pages à gauche, la composition au centre et le chutier à droite. Le filtre Rayon reprend le PIM. Le catalogue Brico-déco propose aussi les familles Luminaires, Miroirs et Ampoules LED. Le responsable peut placer une offre, un visuel ou un logo, déplacer ou redimensionner le bloc et ajouter du texte. Un produit déplacé vers une autre page conserve une seule affectation dans ce support. Le bouton de placement et les champs de position offrent une alternative au glisser-déposer.

Le [BAT collaboratif](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=bd-2704-deco#production?id=bd-ecatalogue&atelier=bat&page=2) ouvre le catalogue original en R1. « Transmettre au BAT » fige la nouvelle composition pour la relecture. La personne qui produit peut générer un lien de relecture, saisir une correction sur une page, y répondre, la marquer résolue ou la rouvrir. Le lien donne au relecteur accès aux épreuves et aux échanges de ce support. La signature est déclarative. Une correction ouverte sur le BAT courant doit être traitée avant sa validation. Les commentaires restent consultables sur la révision annotée.

La recette navigateur déplace le miroir Nina de la page 3 à la page 2, ajoute un visuel et un texte, transmet le BAT R2 et ouvre un deuxième accès relecteur. Elle vérifie la réponse de la production, la résolution et la consultation de R1. Les épreuves déposées en PDF et en image s’affichent dans la surface d’annotation. Un fichier hébergé ailleurs doit autoriser sa lecture par le navigateur pour afficher ses pages dans Studio.

## Données et exploitation du POC

GitHub Pages sert l’interface. Le Worker `bigone-studio-operations` traite les demandes, valide les accès et enregistre les révisions dans la base dédiée `bigone-studio-operations-poc`. Le modèle Workers AI explique les données du dossier. Le service applique une limite de 35 demandes par dossier et 80 au total par jour, puis affiche une synthèse calculée. Une indisponibilité du modèle active le même mode de lecture.

L’[essai S49](https://ruomaleb.github.io/bigone-studio-poc/operation/?op=u-2649-pbs) reste disponible avec ses trois produits témoins, ses deux supports et ses deux flux. Les responsables peuvent ouvrir un espace partagé par opération avec leur code Studio. Le serveur vérifie le rôle auprès du projet Supabase Studio existant à l’ouverture. Il importe l’opération lors du premier accès et conserve ensuite les évolutions du pilote dans D1. Les anciens écrans restent accessibles par l’option `?classique=1`. Les deux systèmes ne disposent pas d’une synchronisation bidirectionnelle.

Les contrôles serveur vérifient la portée magasin, les versions éligibles, les quantités et les budgets. Chaque modification vérifie le numéro de révision. Une confirmation identique est idempotente. Les fichiers PDF, JPEG et PNG de 1 Mo maximum sont attachés aux révisions. Les décisions de BAT conservent les données relues. La remise d’un export repose sur la saisie d’un reçu externe. Les brouillons de relance restent dans le dossier.

## Recette et publication

Lancer `node tests/design-smoke.mjs` puis `node tests/operation.mjs` avec Node 24. Le second contrôle utilise SQLite en mémoire et passe par le gestionnaire HTTP du Worker.

Le schéma D1 est dans `server/schema.sql`. Les quatre modules JavaScript du Worker se déploient avec la configuration `server/wrangler.toml`. Le code Responsable sert à la vérification par le service Studio et ne doit jamais être enregistré dans le dépôt ni journalisé. Le dépôt ne contient que l’identifiant et la clé publique de lecture déjà utilisés par le POC.

Publier depuis `main` vers `gh-pages`. Refaire le parcours sur l’URL publique dans un nouvel essai individuel. Vérifier une confirmation magasin, le changement du compteur d’affiches, la correction du prix de l’emmental et le téléchargement du flux. La base historique du Studio reste disponible en cas de retour au site précédent. Pour revenir à la version antérieure, révoquer le changement de publication par un commit de revert. Les écritures du pilote restent dans la base dédiée.

## Parcours vérifiés

| Parcours | Contrôle effectué |
| --- | --- |
| Assistant et PIM | Sur l’URL publique, une question sur V3 a renvoyé le champagne seul. Le lien de la réponse a ouvert le PIM avec le filtre V3. |
| Participant et réseau | Sur deux sessions aux droits distincts, confirmation de 20 affiches A1 et relecture du total côté enseigne. Le test serveur couvre le double envoi et la limitation des accès. |
| Offre et flux | Sur l’essai en ligne, correction du prix manquant de l’emmental, contrôle de Bonial puis génération et téléchargement du CSV. Après saisie d’un reçu de test, le changement de V1 à V3 a conservé le reçu et permis de télécharger à nouveau le fichier V1 depuis l’historique. |
| BAT | Sur le site publié, ouverture de R2 du prospectus, mise en revue, validation et relecture des trois décisions après rechargement. La recette serveur contrôle également l’accès aux pièces jointes. |
| Réponse détaillée | En navigateur à 1 850 et 390 px, saisie de deux affiches et d’un kit, de 1 500 tracts, d’un budget local de 400 € et d’un café à 6,75 € TTC. Relecture après confirmation. Le kit porte le total à quatre affiches et la PLV à 27 € HT. |
| Import | Lecture du dossier historique S49 et conversion de ses 14 produits, 10 participants, 4 supports et 2 flux. Le test de non-régression porte sur le prix source, la page de placement, le nombre de pages et le numéro de BAT. |

Dans les dossiers historiques, les produits dont la version commerciale reste à renseigner apparaissent dans le PIM. La création d’une référence V3 et d’une affiche A2 limitée à V3 a été vérifiée sur le site publié. La page d’accès au dossier partagé demande le code Responsable dans un navigateur neuf. Dans la session Responsable de Studio, « Utiliser mon accès Studio » a ouvert le dossier partagé S49. Le PIM a affiché ses 14 références. Le dossier partagé est resté ouvert après rechargement. Les liens vers des fichiers de l’ancien Studio dépendent de la disponibilité de leur URL d’origine.

## Finalisation du 27 novembre · version 2026-11-27.4

Le chef de projet peut demander « Prépare un prospectus commun et laisse chaque magasin choisir sa quantité d’affiches A1 ». Il relit les deux supports, le tarif unitaire et l’effet sur les réponses, puis applique le dispositif. Studio conserve les supports déjà présents. Une seconde application garde les mêmes identifiants. Les quantités sont recueillies dans Ma participation.

Un prix local confirmé différent du prix national produit une variante sur les supports compatibles avec la version du magasin. Avant validation, la fenêtre indique le magasin, la version, le support, la page et les deux prix TTC. Si les conditions changent, la variante passe à revoir. La production peut la mettre à jour ou la retirer et relire les changements du BAT. Les décisions passées conservent leur propre copie des produits et variantes.

| Contrôle de reprise | Résultat |
| --- | --- |
| Accès partagé | Connexion Responsable réelle et réouverture du PIM S49 après rechargement. |
| Assistant | Les trois suggestions conservent leur libellé. Une question sur le prix de l’emmental donne accès à sa fiche et à la page 6 du prospectus. |
| Offre locale | Le même produit en V1 et V2 peut avoir un prix local en V1. Ce prix ne crée aucune variante sur un support limité à V2. |
| BAT | La correction d’un prix fait apparaître la page touchée et les montants avant et après. La nouvelle décision conserve ces changements dans l’historique. |

Les tests métier s’exécutent avec `node tests/operation.mjs`. La recette d’interface s’exécute avec `node tests/operation-interface.cjs` dans un environnement équipé de Playwright et Chromium. La variable facultative `CHROMIUM_PATH` désigne un navigateur déjà installé. Ces suites utilisent des données et une base locales.

Sur l’URL publique, la question sur l’emmental a ouvert directement la page 6 du BAT. Dans un essai individuel, la variante de Nanotera Paris 001 en V1 a affiché le café page 7 à 8,40 € TTC au niveau national et 6,75 € TTC pour le magasin. Après correction de l’emmental à 4,99 € et ouverture de R2, le lien vers R1 a retrouvé le prix d’origine à renseigner, y compris après rechargement. Les anciens liens vers un flux ou une révision ouvrent maintenant la pièce demandée.


## Proposition par groupe · version 2026-11-27.5

Ouvrir Préparation → Participants → Proposer une version par groupe. La version donne l’assortiment du PIM. Le responsable compose le ciblage par format, région et type de zone, place ses groupes par ordre de priorité puis applique la proposition. Les recoupements comptent une fois. Les réponses confirmées affectées par une nouvelle version demandent une relecture. Les anciennes sessions des magasins sortis du ciblage perdent l’accès. Les autres confirmations restent acquises.

Le dossier d’essai conserve les mêmes identifiants pour les dix magasins historiques, complète le réseau à 900 et utilise Nanotera dans les écrans du catalogue et du dossier. Les affectations historiques personnalisées restent disponibles jusqu’à la première application du ciblage.

## Fiche produit · version 2026-11-27.6

Le catalogue en cartes ou en liste et le PIM du dossier emploient le même composant de consultation. L’onglet Caractéristiques s’ouvre systématiquement, y compris sur une opération clôturée et en suivant un lien depuis un support. L’onglet Supports associés ouvre chaque utilisation à sa page lorsque la pièce est paginée. La modification de la fiche et la gestion des médias respectent le droit d’écriture du dossier.

Le packshot, son détail et la courte animation de l’ampoule LED sont des illustrations fictives de démonstration. Le beurre, le café, l’emmental, le champagne et une seconde ampoule disposent aussi d’une illustration. Les autres références indiquent les médias effectivement associés. L’éditeur peut associer par URL HTTPS des images, logos ou vidéos avec un libellé. La gestion du catalogue utilise le stockage existant du catalogue. L’essai individuel conserve ses propres associations.

## Pilote de production Nanotera · version 2026-11-28.1

Le dossier Brico-déco s’ouvre avec six invitations V1. B et C ont choisi le kit Gaia au prix commun de 12,50 €. B a engagé 150 € de diffusion. D a commandé dix affiches, E a décliné, A et F doivent répondre. La période commerciale de janvier 2027 et les dates du cadre PAC sont celles du scénario. Les écritures du dossier portent la date de leur exécution.

1. Dans Participants, ouvrir l’accès magasin de A, confirmer le kit et deux lots d’affiches. Par support affiche trente affiches et trois destinataires du kit. Le filtre « Participants sans kit » retrouve D.
2. Dans Production → Supports → Atelier digital, générer et valider les deux PNG communs. Puis confirmer 10,90 € depuis l’accès magasin de C. Les deux formats de C demandent un nouveau BAT.
3. Depuis le vertical de C, inviter un relecteur, consigner une correction, la résoudre et valider. La relecture donne accès aux épreuves de comparaison et au commentaire de cette pièce.
4. Dans Remises, mettre les quatre fichiers à disposition. L’archive de l’enseigne contient les quatre PNG et le bordereau de six affectations. C télécharge ses deux PNG et son bordereau depuis sa participation. Le reçu est saisi à partir d’une référence communiquée par le destinataire.
5. Dans Flux, ouvrir les éditions puis les quatre visuels de l’édition Sud. Vérifier les trois enrichissements à la date simulée du 20 janvier. Le contrôle Bonial renvoie à l’unité de vente de Gaia dans le PIM.

Le cadre JSON du pilote couvre l’origine, l’opération, la révision, les dates et la règle du kit. Un import identique conserve les réponses. La comparaison d’une nouvelle révision identifie les confirmations à revoir avant application. L’atelier génère les PNG dans le navigateur. Le service conserve les fichiers privés, leur empreinte SHA-256 et les BAT dans le stockage du dossier. La reprise génère les seules épreuves manquantes. Une image PIM distante doit autoriser sa lecture par le navigateur.

La matrice réseau réunit les dossiers enseigne autorisés dans ce navigateur. La même règle limite « Mon année » aux invitations du magasin. Les quatre éditions et le reçu EC-001 sont des données de recette. Les API de publication PAC, Digital et diffuseurs font partie des raccordements ultérieurs.

Recette locale du pilote avec `node tests/pilot-model.mjs` et `PILOT_ONLY=1 node tests/operation-interface.cjs`. La suite entière reprend aussi S49, la mise en page du catalogue, le BAT collaboratif et les parcours mobiles. La livraison utilise le service et la base existants. Pour revenir à la publication précédente, restaurer le déploiement Pages antérieur et la version Worker `e2ff1e01-3617-429b-9002-70fbd475fd35`. Les dossiers de recette restent isolés.
