# Dossier d’opération et assistant Studio

## Accès

Le [dossier S49 avec Assistant](https://ruomaleb.github.io/bigone-studio-poc/operation/?assistant=1) ouvre un espace d’essai individuel conservé sur le serveur. La clé d’accès reste dans le navigateur. Participants → Accès magasin génère un lien individuel. Ce lien donne accès à la réponse de ce seul magasin sur un autre appareil. L’URL de l’essai seule ouvre un espace indépendant dans un autre navigateur. La durée de validité des accès est de 60 jours.

Les six rubriques sont Informations, Participants et Supports en Préparation, Produits dans le PIM, puis Supports et Flux en Production. Informations contient le rétroplanning. Le tiroir Assistant propose des questions, une saisie libre et des liens vers les fiches. L’historique de conversation est local à chaque navigateur et à chaque rôle.

## Données et exploitation du POC

GitHub Pages sert l’interface. Le Worker `bigone-studio-operations` traite les demandes, valide les accès et enregistre les révisions dans la base dédiée `bigone-studio-operations-poc`. Le modèle Workers AI explique les données du dossier. Le service applique une limite de 35 demandes par dossier et 80 au total par jour, puis affiche une synthèse calculée. Une indisponibilité du modèle active le même mode de lecture.

L’essai utilise les trois produits témoins, les deux supports, les deux flux et les dix participants de la maquette S49. Les responsables peuvent ouvrir un espace partagé par opération avec leur code Studio. Le serveur vérifie le rôle auprès du projet Supabase Studio existant à l’ouverture. Il importe l’opération lors du premier accès et conserve ensuite les évolutions du pilote dans D1. Les anciens écrans restent accessibles par l’option `?classique=1`. Les deux systèmes ne disposent pas d’une synchronisation bidirectionnelle.

Les contrôles serveur vérifient la portée magasin, les versions éligibles, les quantités et les budgets. Chaque modification vérifie le numéro de révision. Une confirmation identique est idempotente. Les fichiers PDF, JPEG et PNG de 1 Mo maximum sont attachés aux révisions. Les décisions de BAT conservent les données relues. La remise d’un export repose sur la saisie d’un reçu externe. Les brouillons de relance restent dans le dossier.

## Recette et publication

Lancer `node tests/design-smoke.mjs` puis `node tests/operation.mjs` avec Node 24. Le second contrôle utilise SQLite en mémoire et passe par le gestionnaire HTTP du Worker.

Le schéma D1 est dans `server/schema.sql`. Le Worker ES et ses trois modules se déploient avec la configuration `server/wrangler.toml`. Le code Responsable sert à la vérification par le service Studio et ne doit jamais être enregistré dans le dépôt ni journalisé. Le dépôt ne contient que l’identifiant et la clé publique de lecture déjà utilisés par le POC.

Publier depuis `main` vers `gh-pages`. Refaire le parcours sur l’URL publique dans un nouvel essai individuel. Vérifier une confirmation magasin, le changement du compteur d’affiches, la correction du prix de l’emmental et le téléchargement du flux. La base historique du Studio reste disponible en cas de retour au site précédent. Pour revenir à la version antérieure, révoquer le changement de publication par un commit de revert. Les écritures du pilote restent dans la base dédiée.
