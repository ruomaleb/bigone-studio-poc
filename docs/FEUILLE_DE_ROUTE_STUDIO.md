# Concevoir et piloter une opération dans BigOne Studio

*Feuille de route de l’assistant IA · 27 novembre 2026*

Le chef de projet doit pouvoir répondre à trois questions depuis le même dossier. Quels points de vente participent et qu’ont-ils choisi ? Quels produits composent l’offre commerciale de cette opération et de chaque version ? Quels supports peut-on faire avancer aujourd’hui ? Le premier développement proposé relie les réponses à la ligne magasin, à la fiche offre ou à la révision du support concerné.

## État du POC au 27 novembre 2026

Les cinq lots ci-dessous sont disponibles dans le [dossier d’essai S49](https://ruomaleb.github.io/bigone-studio-poc/operation/?assistant=1). La [note de recette](DOSSIER_OPERATION.md) décrit les observations en ligne, les tests reproductibles, les droits et le fonctionnement du dossier partagé. Les cases cochées correspondent aux contrôles techniques et aux parcours vérifiés dans le POC. Le compte rendu précise les vérifications réalisées en ligne et les tests locaux. La mesure chronométrée avec ces utilisateurs reste à réaliser.

La version **2026-11-27.6** réunit le ciblage par groupes de magasins Nanotera et la fiche produit commune au catalogue et au PIM. Le magasin consulte sa version et son assortiment avant de répondre. Le responsable consulte les caractéristiques et les médias du produit dès l’ouverture de la fiche.


## Ce que voit le chef de projet en ouvrant une opération

Le dossier s’ouvre sur Informations. Sous les données de l’opération et la section « Dates et jalons », le bloc « À préparer » renvoie aux participants, aux fiches produits ou à la pièce à relire. Chaque entrée donne un fait, sa conséquence et une action. Le planning de l’accueil conserve son bloc repliable. L’utilisateur retrouve les rubriques et les filtres du dossier. Le bouton « Assistant » dans la barre supérieure ouvre le volet à droite. L’utilisateur peut poser une question sur le dossier tout en gardant sous les yeux le tableau des magasins, la fiche offre ou le BAT.

**Engagements.** Dans l’exemple, « Confirmer les choix de supports » renvoie au tableau des participants pour l’affiche A1. Il distingue 540 magasins engagés dont la sélection est héritée et 270 magasins en attente dans un nouvel essai. Pour la livraison, chaque compteur ouvre la sélection correspondante.

**Offre commerciale.** « Compléter les produits utilisés » ouvre le PIM. Dans l’extrait, la ligne de l’emmental donne accès au prix manquant et à la page du prospectus qui reprend l’offre.

**Supports.** « Affiche A1 en corrections » ouvre la révision concernée. « Prospectus prêt à relire » ouvre le BAT avec les offres encore signalées et la personne dont on attend la décision.

## Navigation du dossier

Les trois espaces se déplient dans l’ordre suivant. Cliquer sur leur intitulé ouvre ou referme leur sous-volet. Cliquer sur une rubrique ouvre l’écran correspondant dans la même opération. Le dossier et l’Assistant conservent leur contexte lorsqu’on manipule un chevron.

| Espace | Rubriques dans l’ordre | Travail effectué |
| --- | --- | --- |
| Préparation | **Informations** · **Participants** · **Supports** | Définir l’opération et ses échéances, recueillir les engagements et choisir le dispositif. |
| Produits | **Produits** | Tenir le PIM de l’offre commerciale dans un tableau unique. |
| Production | **Supports** · **Flux** | Suivre, d’une part, les fichiers, révisions et BAT et, d’autre part, la préparation et la remise des exports de données. |

### Préparation

**Informations** reprend le contenu du brief existant : objectif commercial, pilote enseigne, contact agence, réseau, portée, période, contraintes et décisions. La section repliable **Dates et jalons** regroupe le rétroplanning de cette seule opération. La période commerciale indique quand l’offre est valable. Les jalons indiquent quand l’équipe doit terminer une tâche, pour quelle pièce et avec quel état. Le calcul existant part de l’échéance de remise du livrable et du modèle de sa famille. Par exemple, le modèle imprimé positionne « BAT 1 prêt pour revue » huit jours ouvrés avant la remise. Préserver les jalons généraux, le filtrage par support et par état, la génération ou le recalcul ainsi que le marquage d’une tâche terminée. Le planning du tableau de bord reste accessible à l’échelle de plusieurs opérations.

**Participants** réunit les points de vente du dossier, leur participation, leur version commerciale et leurs engagements par support. Une relance s’ouvre sur la sélection concernée. Le participant connecté retrouve sa propre réponse et ses choix dans « Ma participation ».

**Supports** décrit le dispositif à préparer. La liste du prospectus et de l’affiche mène aux formats, variantes, quantités attendues et choix demandés aux participants. Dans le prototype de référence, l’atelier visuel permet de feuilleter des modèles, d’importer un visuel et de personnaliser un bandeau. Retirer ce bloc de la liste et du détail des supports en Préparation. Conserver les références, sélections, fichiers et créations déjà enregistrés.

### Produits

La rubrique **Produits** ouvre le PIM de l’opération. Une ligne correspond à une référence de l’offre commerciale. Le tableau présente le libellé, le conditionnement, les versions éligibles et les anomalies. Le nom du produit ouvre une fiche de 1 160 px sur grand écran. Les cartes, la liste, le PIM et les liens depuis un support ouvrent « Caractéristiques ». La galerie propose les images du produit, les logos qui lui sont associés et les vidéos avec leurs commandes de lecture. L’onglet « Supports associés » donne les supports et les pages utilisant la référence. Les champs d’une fiche ouverte à l’écriture se modifient dans la même fenêtre. Le mode consultation reste disponible pour une opération clôturée.

Les versions sont une **propriété multivaluée du produit** et un filtre du tableau. Filtrer sur V1, V2 ou V3 conserve le même tableau et ses colonnes. Fermer la fiche retrouve le filtre précédent. Dans Participants, l’ordre des groupes détermine la version proposée au magasin. Conserver la version affectée initialement et la version effectivement retenue dans la réponse. Le périmètre du PIM se limite au référentiel produit. Les comparaisons par magasin et la consultation d’un assortiment magasin sortent du périmètre de ses écrans.

### Production

**Supports** suit l’exécution des pièces décidées en Préparation. Pour chaque support, afficher la révision, l’état de correction ou de revue, le fichier de travail et le BAT correspondant. Les deux rubriques Supports partagent l’identifiant du livrable. Leur entrée de navigation, leurs colonnes et leurs actions sont propres à leur espace.

**Flux** regroupe les exports structurés de données produits. Les familles Bonial et Tiendeo existent dans le prototype. La maquette propose une ligne par export avec sa destination, la version commerciale retenue et son étape de production. Un contrôle signale le produit et le champ à corriger, ouvre la fiche PIM concernée et permet de relancer la vérification. Distinguer la génération d’un fichier, le résultat du contrôle et la remise effective. Les affectations V1/V2 et les états de flux affichés sur S49 sont illustratifs.

### Intégration et recette de navigation

- [x] Retrouver dans le menu respectivement trois rubriques en Préparation, une en Produits et deux en Production, dans l’ordre du tableau.
- [x] Ouvrir et replier Dates et jalons dans Informations. Conserver la rubrique, le sous-volet, le filtre de jalons et la conversation. Vérifier qu’une tâche existante conserve son échéance et son état.
- [x] Vérifier que Préparation → Supports ouvre directement le dispositif sur la liste et la fiche. Production → Supports ouvre les révisions et BAT. Production → Flux ouvre les exports. Aucun de ces liens de la maquette ne renvoie à l’ancienne galerie.
- [x] Depuis le prospectus ou un contrôle de flux, ouvrir la fiche produit concernée. Le PIM ouvre la fiche dans l’onglet Caractéristiques et conserve le dossier. Les filtres de version s’appliquent au tableau et n’ajoutent pas de rubrique.
- [x] Associer les liens existants de cadrage à Informations, de calendrier à Informations avec les jalons ouverts, de magasins à Participants et d’offres au PIM. Conserver les identifiants des dossiers, produits, supports et révisions pour les liens directs.
- [x] Au clavier, rendre les chevrons activables avec Entrée et Espace. Utiliser `aria-expanded` et `aria-controls` pour le sous-volet et `aria-current="page"` pour la rubrique affichée. Deux entrées intitulées « Supports » gardent chacune le nom de leur espace comme contexte accessible.

**Lecture de la maquette.** Les six rubriques sont accessibles par le menu du PDF. Les signets « Préparation · Supports », « Production · Supports » et « Production · Flux » ouvrent directement les trois écrans. Les filtres V1, V2 et V3 et la fiche produit dépliée sont des états du même PIM.

## Règles de l’offre commerciale

Une référence de l’opération est éligible à une ou plusieurs versions commerciales. Chaque point de vente participant est rattaché à une seule version pour cette opération. Cette relation détermine quels produits entrent dans les pièces ou les exports destinés à son périmètre. La participation, les choix de supports et les quantités sont suivis séparément.

### Exemple fictif du dossier S49

Le jeu de démonstration S49 contient trois typologies de sortie de l’offre. Le tableau illustre trois références du dossier.

| Produit illustré | V1 · Sélection du quotidien | V2 · Sélection festive | V3 · Produit vedette |
| --- | --- | --- | --- |
| Emmental râpé 3 × 200 g | Éligible | Éligible | — |
| Café moulu 4 × 250 g | Éligible | — | — |
| Champagne brut 75 cl | — | Éligible | Éligible |
| **Nombre de références dans l’extrait** | **2** | **2** | **1** |

L’extrait compte **3 produits distincts** et 5 liens d’éligibilité. Le champagne utilise la même fiche dans la sélection festive et en produit vedette. La version commerciale détermine les références proposées au point de vente. Les supports et canaux choisis sont des décisions indépendantes.

### Modèle métier proposé pour le développement

| Objet | Règle à garantir |
| --- | --- |
| Version commerciale | Identifiant stable et libellé dans une opération. Le rattachement du participant est défini pour chaque opération. Le même point de vente peut ainsi participer à une autre opération avec une autre version. |
| Produit de l’opération | Réutiliser la référence produit et l’identité d’offre existantes. La fiche porte les conditions de l’opération. Une nouvelle appartenance à une version réutilise la même fiche. |
| Éligibilité produit ↔ version | Relation plusieurs-à-plusieurs. Une fiche exploitable est éligible à **une ou plusieurs versions**. Chaque paire produit de l’opération / version est unique et appartient à la même opération. |
| Affectation magasin → version | **Une seule version** par couple opération / magasin. Changer de version remplace l’affectation existante en une seule écriture et enregistre la modification. Plusieurs magasins peuvent partager la même version. |
| Sélection pour un périmètre de production | Résoudre la version dans l’opération, puis sélectionner les produits éligibles à cette version. Réutiliser cette règle pour le filtre du PIM, les pièces, les flux et les réponses de l’Assistant. Un total réseau compte les identifiants de produits distincts. |

**Dossiers existants.** Une référence ou un magasin importé sans correspondance porte l’état « À affecter ». Le chef de projet peut terminer le rattachement progressivement. La ligne d’un participant sans version signale le rattachement à compléter dans Participants. Un produit sans version reste dans les fiches à compléter. Proposer un récapitulatif des éléments incomplets avant validation de l’offre.

**Conséquence d’une modification.** Avant de retirer un produit d’une version, indiquer les magasins de cette version et les supports ou pages qui utilisent effectivement cette offre. Avant d’appliquer le ciblage, afficher l’assortiment proposé, le nombre de magasins qui changent de version, les sorties et les confirmations à revoir. Après confirmation, recalculer la sélection éligible pour les supports et les flux concernés. Une révision de BAT déjà validée conserve son contenu et sa décision. Les pièces concernées sont signalées pour revue. Une version commerciale organise l’assortiment, tandis qu’une révision de BAT identifie un état daté d’un fichier.

## Participants · paramétrage enseigne et réponse du magasin

Depuis Informations ou Participants, « Proposer une version par groupe » ouvre le paramétrage de l’opération. Ce parcours comporte cinq étapes internes à Participants. Le responsable peut basculer vers un aperçu du parcours magasin et revenir à sa configuration. Les six entrées du menu principal restent celles de la section Navigation.

Le réseau de démonstration Nanotera comprend 900 magasins fictifs. Trois groupes de format contiennent initialement 300 magasins chacun. Les valeurs d’un même critère se cumulent (Bretagne ou Normandie). Deux critères différents se croisent (hypermarché en Bretagne). La proposition affiche le nombre correspondant avant application. L’ordre des groupes est modifiable et le premier groupe correspondant fournit l’unique version du magasin. Une nouvelle règle prend la première position. Les magasins sans correspondance sortent de la proposition. Le serveur conserve leurs données et ferme leur accès à la réponse. La liste des participants se consulte par pages de 25.

| Étape enseigne | Décisions et données à conserver |
| --- | --- |
| Proposition par groupe | Choisir V1, V2 ou V3, vérifier les références du PIM, puis définir le groupe par format, région ou zone et sa règle de participation. |
| PLV | Proposer des supports au détail et des kits. Définir unité, prix indicatif HT, composition et prix propre de chaque kit. Piloter séparément l’affichage des prix et celui du sous-total. |
| Canaux propriétaires | Autoriser individuellement SMS, RCS, e-mail, écrans internes et réseaux sociaux organiques. Le magasin sélectionne ensuite ses canaux parmi ceux proposés. |
| Publicité | Proposer le tract et sa pagination, des kits digitaux avec budget local recommandé, la presse et l’affichage extérieur. La saisie porte sur l’intention du point de vente et son budget. La planification, la diffusion et les mesures de performance relèvent des autres modules BigOne. |
| Offre produits | Associer l’offre du PIM et sélectionner les références éligibles par version. Définir si le point de vente peut retenir des références localement et s’il peut renseigner un prix local TTC. Toute modification d’éligibilité utilise la même association produit/version que le PIM. |

**Parcours magasin.** Le magasin indique sa participation, retrouve la version et l’assortiment proposés à son groupe, commande ses unités et kits PLV, sélectionne ses canaux propriétaires, puis ses options publicitaires. Dans « Mon offre produits », il personnalise les seules références éligibles et autorisées. Cette étape appartient à la réponse du participant. Elle ne crée aucune entrée de navigation dans le PIM. En cas de refus d’une opération facultative, aller directement au récapitulatif. Une participation obligatoire suit le parcours d’engagement. Masquer l’étape de personnalisation quand aucune offre éligible n’est proposée.

**Montants et confirmation.** Présenter les valeurs HT de la PLV, le budget digital retenu et le prix de vente local TTC avec leurs unités. Dans la maquette, deux affiches à 4,50 € HT et un kit à 18 € HT donnent **27 € HT**. Les deux affiches et dix stop-rayons inclus dans le kit ne sont pas facturés une deuxième fois. Le tract porte sur 1 500 exemplaires, le budget digital retenu est de 400 € HT pour une recommandation de 450 € HT, et le prix local du café est de 6,75 € TTC. Le récapitulatif reprend les choix avant confirmation. Le scénario de relance de l’affiche A1, qui illustre séparément une réponse de **20 exemplaires**, ne s’additionne pas à cet exemple.

**Écriture à développer.** Enregistrer la configuration par opération et la réponse par couple opération / participant. Réserver le paramétrage aux rôles enseigne autorisés. Vérifier côté serveur participation, version, éligibilité et options autorisées avant confirmation. Conserver les quantités et les choix de canaux compatibles lors d’un changement de version. Retirer les références et prix locaux devenus inéligibles de la réponse effective. Une double confirmation est idempotente. Un changement de configuration qui affecte une réponse confirmée doit être identifiable lors de sa prochaine revue.

## Interface de l’assistant à développer

La capture de BigOne Media fournie le 27 novembre 2026 donne le gabarit du volet à l’ouverture. La capture de la conversation sur deux opérations de septembre donne le gabarit du fil après réponse. Dans Studio, le contenu des suggestions, les données disponibles et les liens de la réponse dépendent de l’opération ouverte et du rôle de l’utilisateur.

| État ou zone | Comportement attendu dans Studio |
| --- | --- |
| Ouverture | Depuis la barre supérieure, ouvrir le volet sur le bord droit, du haut au bas de la fenêtre. Sur le format de référence de 1 850 × 914 px, réserver 460 px au volet et 1 390 px au dossier. La navigation et le contenu de Studio restent utilisables à gauche. |
| En-tête | Reprendre le pictogramme dégradé, le titre « Assistant » et les commandes de BigOne Media dans le même ordre. Dans une nouvelle conversation, afficher l’historique, la création de conversation, l’agrandissement et la fermeture. Le titre de la conversation occupe un bandeau distinct au-dessous. |
| Nouvelle conversation | Centrer le pictogramme rond, « Comment puis-je vous aider ? » et une introduction courte. Afficher trois questions suggérées, chacune dans un bouton blanc bordé avec le pictogramme de conversation. Un clic soumet la question et ouvre le fil. |
| Conversation | Placer la question de l’utilisateur à droite dans une bulle noire. Placer la réponse en dessous, avec l’avatar, le nom « Assistant », la pastille « Studio » et une carte blanche. Sous la carte, reprendre les commandes Copier, Utile et Inutile. Dans la carte, nommer précisément la fiche ou la page accessible par chaque lien. |
| Pied du volet | Garder visibles le contexte, la saisie, le bouton d’envoi, l’indication clavier, la note sur l’origine des réponses et l’accès à l’aide. Afficher l’enseigne et le dossier actifs, ou le magasin et le dossier dans « Ma participation ». Entrée envoie le message, Maj + Entrée insère un saut de ligne. Seul le fil défile quand la réponse s’allonge. |
| Retour au dossier | Fermer le volet restitue l’espace au dossier et rend le focus au bouton « Assistant ». Rouvrir sur le même dossier retrouve la conversation en cours. À l’ouverture d’une autre opération, afficher son contexte avant toute nouvelle question. |

**Parcours de référence.** Les trois questions de l’accueil de la maquette ouvrent respectivement les engagements pour l’affiche A1, l’éligibilité des produits par version et la relecture du prospectus. Le premier parcours conduit au brouillon de relance, puis illustre la confirmation de 20 affiches par un magasin. Le deuxième permet de filtrer le tableau du PIM par version et de passer de la fiche d’emmental à la page 6 du prospectus. La vue côté magasin représente une session du point de vente et se limite à ses propres choix.

## Recette visuelle du volet

- [x] À la dimension de référence, comparer l’ouverture à la capture fournie. Le volet commence à 1 390 px du bord gauche. L’en-tête mesure 72 px, le bandeau « Nouvelle conversation » 40 px et la zone de contexte et de saisie commence vers 720 px du bord haut.
- [x] Vérifier les trois questions suggérées en entier, sur une ou deux lignes chacune. Chacune ouvre la réponse attendue et conserve le contexte de S49.
- [x] Envoyer une question, puis une deuxième dans le même fil. Faire défiler une réponse longue. Le titre, le contexte actif et le champ de saisie restent accessibles.
- [x] Depuis une réponse sur le prix de l’emmental, ouvrir la page 6 du prospectus. Le dossier S49 reste actif et le fil conserve la question d’origine.
- [x] Au clavier, ouvrir le volet, atteindre les questions et la saisie, créer un saut de ligne, puis envoyer et fermer. Chaque bouton à pictogramme a un nom accessible.
- [x] Sur une fenêtre trop étroite pour afficher dossier et volet côte à côte, présenter le volet en pleine largeur. Revenir à la fiche conserve les filtres et la sélection. Cette adaptation est proposée pour Studio.

## Lire les engagements dans Préparation

Dans le jeu fictif « Les prix bas de la semaine S49 », Studio affiche 900 points de vente Nanotera ciblés, 540 engagés, 270 en attente et 90 non participants. Les 540 engagés ont une liste de supports héritée, à confirmer. Le tirage confirmé affiche un tiret tant que la quantité est inconnue. Ce résultat ne permet pas de commander un tirage. Il faut connaître les choix et les quantités effectivement confirmés.

## Concevoir le dispositif avec le réseau

### Au démarrage de l’opération

Le chef de projet précise le cadre et la période dans Informations, rattache les points de vente dans Participants, enrichit les fiches dans le PIM et définit les supports en Préparation. L’assistant peut transformer une consigne en proposition de dispositif. Il affiche séparément les éléments trouvés dans le dossier, ceux qui demandent une précision et les décisions qui restent à prendre.

**Exemple proposé.** « Prépare un prospectus commun. Laisse chaque magasin choisir son nombre d’affiches A1. » Studio propose un prospectus national et une affiche avec quantité à saisir par point de vente. La sélection de produits de chaque support respecte sa version commerciale cible. Le chef de projet relit la proposition et l’applique. Le choix du support par le magasin reste ouvert jusqu’à sa réponse.

### Côté point de vente

Proposer une vue courte « Ma participation ». Le magasin voit les dates, les offres concernées, les supports accessibles et la date de réponse. Il indique sa participation, sélectionne ses supports, renseigne les quantités demandées pour les imprimés et signale une exception à traiter. Un récapitulatif lui permet de confirmer l’ensemble et d’identifier ensuite sa dernière réponse.

### Côté chef de projet

Dans Participants, proposer deux lectures du même engagement. Par magasin, une fiche donne la participation, les supports choisis et les informations restant à confirmer. Par support, l’affiche A1 affiche les magasins concernés, la somme des quantités confirmées et le nombre de réponses manquantes. Un clic sur ce nombre ouvre les seuls magasins à reprendre.

**Question libre.** « Qui dois-je relancer pour le tirage de l’affiche ? » L’assistant distingue les magasins qui doivent encore se prononcer de ceux qui ont choisi l’affiche mais n’ont pas confirmé la quantité. Le chef de projet peut préparer un brouillon de relance adapté à chaque liste.

**Règle de lecture.** Une quantité non renseignée reste distincte d’un zéro confirmé. Un magasin non participant sort des relances. Un magasin ayant décliné l’affiche peut rester engagé sur le prospectus. Une liste héritée est une proposition à confirmer.

## Relier les produits aux supports et aux BAT

### Partir du produit pour comprendre une correction

Sur S49, le tableau comporte 14 offres. Le produit « Emmental râpé 3 x 200 g » porte la mention « Prix manquant ». La fiche dépliée présente l’utilisation dans le prospectus en page 6. Le dossier de référence relie également l’offre à l’affiche A1. L’assistant peut ainsi guider un utilisateur depuis une anomalie précise vers les pièces de production à revoir.

**Interaction proposée.** Dans la maquette, « Ouvrir le BAT concerné » ouvre la page 6 du prospectus depuis la fiche dépliée. Pour la livraison, prévoir la liste complète des supports, pages et variantes concernés lorsqu’il existe plusieurs utilisations. L’utilisateur ouvre la fiche, renseigne le prix validé par l’enseigne et voit quelles pièces doivent être revues. Une exception locale indique le magasin auquel elle s’applique.

### Partir du support pour préparer la production

Depuis Préparation → Supports, « Que manque-t-il pour préparer l’affiche A1 ? » réunit les choix et quantités. La réponse de l’Assistant peut renvoyer vers les anomalies du PIM et la révision suivie dans Production → Supports. L’utilisateur peut traiter le prix dans la fiche offre, consulter les réponses magasins ou ouvrir la révision. Chaque lien le ramène au dossier et au support sélectionnés.

Pour le prospectus, la même question se lit page par page. Si une offre change, le graphiste accède directement à la page touchée. Pour un support numérique sans tirage, l’interface montre les formats, les variantes et les fichiers attendus. Les quantités sont demandées uniquement aux supports qui en ont besoin.

### Au moment du bon à tirer

Avant une revue, l’assistant présente les changements intervenus depuis la révision précédente et les points restant à arbitrer. Le responsable ouvre le BAT concerné et prend sa décision dans le circuit de validation Studio. Une correction ultérieure conserve la révision relue et prépare la suivante pour les supports concernés.

**Rôle de l’IA.** Studio calcule les compteurs, les quantités et les dépendances depuis les données enregistrées. L’IA explique la situation, répond aux questions et prépare les textes ou les variantes à relire. Un prix, une participation, une quantité et une décision de BAT ont chacun un auteur et une source identifiables.

## Feuille de route de développement

Ordre de livraison proposé. Chaque lot doit permettre à un utilisateur d’accomplir une tâche complète dans le dossier. Le chiffrage en jours dépendra du modèle d’engagement existant et des accès prévus pour les points de vente.

### Lot 1 — Livrer le PIM de l’opération

Réutiliser les identifiants des opérations, produits et magasins du prototype. Introduire les versions commerciales, les liens d’éligibilité et l’affectation d’un magasin dans une opération. Livrer le tableau PIM, la fiche en ligne et le choix multiple des versions. Appliquer l’affectation collectivement depuis Participants. Exposer au volet Assistant la même lecture filtrée que celle de l’écran, avec les droits de l’utilisateur.

- [x] Sur les trois produits d’exemple, vérifier deux références en V1, deux en V2, une en V3 et trois références distinctes sur l’ensemble.
- [x] Rattacher l’emmental à V1 et V2. Une seconde sauvegarde des mêmes choix conserve une seule fiche et deux liens d’éligibilité.
- [x] Sur une copie du dossier, faire passer le groupe contenant Nanotera Paris 001 de V1 à V2. Vérifier dans les données de production que la sélection éligible conserve l’emmental, retire le café et ajoute le champagne. Le magasin a une seule affectation après sauvegarde.
- [x] Retirer l’emmental de V2. Vérifier son maintien en V1 et la liste des pièces de V2 à revoir. Retirer sa dernière version demande de compléter l’offre avant sa validation.
- [x] Traiter un ancien dossier sans versions. Les éléments à affecter restent identifiables et le dossier reste consultable.
- [x] Depuis Participants, ouvrir « Ma participation » avec un compte point de vente rattaché à V1. Vérifier le cloisonnement des engagements lors d’un chargement et d’un accès direct.

### Lot 2 — Expliquer la situation de l’opération

Livrer le menu du dossier avec les sous-volets Préparation, Produits et Production, le volet Assistant, son accueil, son fil et la saisie. Relier les réponses et les trois entrées du bloc « À préparer » aux vues filtrées. Vérifier la recette du menu et celle du volet Assistant pour accepter ce lot. Réutiliser les règles métier et les identifiants existants.

- [x] Sur S49, retrouver 6 magasins engagés, 3 en attente et 1 non participant.
- [x] Ouvrir séparément les 6 sélections héritées à confirmer.
- [x] Depuis l’offre d’emmental au prix manquant, atteindre la page 6 du prospectus.

### Lot 3 — Recueillir et consolider les engagements

Livrer les cinq étapes de configuration enseigne, le parcours de réponse du magasin, son récapitulatif, la confirmation et la synthèse réseau. Raccorder ces parcours au catalogue de supports, aux versions du PIM et aux droits du participant.

- [x] Vérifier participation obligatoire et facultative, refus, version fixée et version modifiable.
- [x] Passer de V1 à V3 et retrouver seulement le champagne dans l’extrait. Les canaux choisis et les quantités PLV restent identifiables.
- [x] Masquer les options non proposées et les champs de personnalisation fermés par l’enseigne. Un prix saisi par un magasin ne modifie aucune autre fiche nationale ou locale.
- [x] Vérifier les 27 € HT de PLV, le budget retenu indépendant, les 1 500 exemplaires du tract et le prix local TTC. Un tract activé demande une quantité positive et un kit digital retenu un budget positif.
- [x] Recharger un brouillon, confirmer puis relire la même réponse. Un second magasin commence avec sa propre affectation et ses propres choix.

- [x] Sur une copie de test, un magasin peut choisir 20 affiches et décliner le prospectus.
- [x] Même en cas de double clic sur la confirmation, le total confirmé de l’affiche augmente de 20 une seule fois.
- [x] Le magasin retrouve sa réponse. Le chef de projet distingue les quantités confirmées de celles qui restent à obtenir.

### Lot 4 — Préparer les supports et leurs variantes

Livrer la liste et le détail du dispositif dans Préparation → Supports, la sélection des produits, les exceptions locales et l’aperçu des modifications. Retirer les appels à la galerie créative sur les deux écrans de préparation.

- [x] Un prix local différent crée une proposition de variante pour le magasin concerné.
- [x] Avant validation, l’aperçu désigne les supports et les pages touchés.
- [x] Après validation, le prix national et les prix des autres magasins conservent leur valeur.

### Lot 5 — Livrer les écrans Supports et Flux de Production

Livrer la synthèse des modifications par révision et les liens entre anomalie, support, page et BAT. Affecter les livrables de famille flux à Production → Flux. Réutiliser les étapes de préparation des données, contrôle et remise.

- [x] Depuis une offre corrigée après revue, ouvrir la pièce concernée et préparer la révision suivante.
- [x] Retrouver la décision prise sur la révision précédente.
- [x] Poursuivre le travail sur les supports indépendants.
- [x] Depuis un flux de la version V1 avec un prix manquant, atteindre la ligne concernée du PIM avec le bon filtre. Après correction, rejouer le contrôle et tracer son résultat. La remise effective dispose de son propre état.

**Validation métier du parcours complet.** Demander à un chef de projet de retrouver les magasins à relancer pour l’affiche, puis à un chargé de production d’identifier la page concernée par un prix manquant. Vérifier la justesse des deux réponses et mesurer le temps jusqu’à l’ouverture de la bonne fiche. Le pilote suivant ajoute le point de vue du magasin qui confirme sa commande de supports.

## Correspondance avec les maquettes de développement

Le PDF consolidé et les sources du parcours Participants sont les références de cette recette. Le kit fournit un index HTML local, les planches vectorielles à la taille de référence de 1 850 × 914 px, les liens entre états et le prototype de saisie. Les signets, les numéros de planche et le manifeste du kit identifient les mêmes écrans.

| Planches PDF | Vue ou scénario | Lots |
| --- | --- | --- |
| 1 et 25 | Informations et Dates et jalons, section fermée ou ouverte | 2 |
| 2 à 6 | Paramétrage enseigne, des règles de participation à la composition de l’offre | 1, 3, 4 |
| 7 à 12 | Parcours magasin, personnalisation, récapitulatif et réponse confirmée | 3 |
| 13 à 16 | Engagements, relance A1, réponse à 20 exemplaires et synthèse | 3 |
| 17, 19 à 21, 26, 27 et 74 | PIM unique, filtres V1/V2/V3 et fiches dépliées | 1 |
| 18, 22 à 24 | BAT, dispositif en préparation, supports en production et flux | 4, 5 |
| 28 à 73 et 75 à 77 | Variantes du menu sur le même écran, y compris les trois états complémentaires du filtre V3 | 2 |

**Portée de la recette.** Les planches comportent des liens de navigation. Les champs du paramétrage et du parcours participant se testent dans le prototype HTML. Les réponses de l’Assistant, les budgets et les volumes affichés sont des exemples. Les cases des lots décrivent la recette de l’application à développer. Pour une livraison en production, les API, les contrôles de droits, la persistance serveur, les confirmations concurrentes et la remise des flux doivent être réalisés et testés sur une opération autorisée.

## Références du prototype consulté

Le comportement de l’ancien calendrier, les champs du brief et la composition de la page Supports ont été vérifiés dans la version du prototype du 26 novembre. Les écrans et les états proposés ci-dessus constituent la cible de développement.

- [Champs de cadrage de l’opération](https://github.com/ruomaleb/bigone-studio-poc/blob/7f434de86bb53eede380bc8951b1de7bace77505/index.html#L503)
- [Liste des supports et rétroplanning par livrable](https://github.com/ruomaleb/bigone-studio-poc/blob/7f434de86bb53eede380bc8951b1de7bace77505/index.html#L630)
- [Galerie de modèles et personnalisation de visuels](https://github.com/ruomaleb/bigone-studio-poc/blob/7f434de86bb53eede380bc8951b1de7bace77505/assets/visuels.js#L91)
- [Familles de livrables et jalons de contrôle des flux](https://github.com/ruomaleb/bigone-studio-poc/blob/7f434de86bb53eede380bc8951b1de7bace77505/index.html#L63)
