# STORMDROP — Battle Royale (v5)

Le jeu est une appli web installable (PWA) : ouvre l'adresse en ligne, puis clique sur INSTALLER dans le lobby
(ou sur l'icône d'installation de la barre d'adresse de Chrome / Edge). Après la première ouverture il fonctionne hors ligne.

En local : `python -m http.server 8000` dans ce dossier, puis http://localhost:8000.
Three.js 0.160 est embarqué dans `vendor/`, aucun CDN n'est requis.

Contours cartoon : Paramètres > Général > Contours cartoon (activés par défaut) et Épaisseur des contours.

## Commandes par défaut (modifiables dans Paramètres > Touches)

Les touches sont définies par position physique : le jeu affiche automatiquement le nom correspondant à ton clavier.

| Action | AZERTY | QWERTY |
| --- | --- | --- |
| Déplacement | Z Q S D | W A S D |
| Sauter / Sprint / Accroupi | Espace / Maj / F | Espace / Maj / F |
| Glissade | F pendant un sprint (Espace pour un saut glissé) | F pendant un sprint |
| Mode construction | A | Q |
| Mur / Sol / Rampe / Toit | W X C V | Z X C V |
| Changer de matériau | T ou clic droit en construction | T |
| Éditer une pièce | G (clic gauche sur les cases, G pour valider) | G |
| Viser (ADS) | clic droit avec une arme | clic droit |
| Recharger / Interagir | R / E | R / E |
| Changer d'épaule | H | H |
| Grande carte / Marqueur | , / N (clic sur la carte) | M / N |
| Emote | B | B |

## Contenu principal

- Construction sur grille (bois, pierre, métal avec vie et temps de renforcement différents), édition 3x3 (portes, fenêtres) des murs et des sols.
- Tir : ADS avec zoom, recul, dispersion croissante, dégâts tête x2, chiffres colorés (corps, tête, bouclier).
- Butin en 5 raretés, soins avec barre de progression, coffres lumineux, largages en parachute.
- Bus de combat au trajet aléatoire, chute libre dirigée, planeur.
- Tempête en phases, grande carte, minicarte, marqueurs, noms de lieux, biomes forêt, désert, neige, plage.
- Voitures, bateaux, trampolines, cheminées d'air.
- 30, 50 ou 100 joueurs, modes Solo, Duo, Escouade avec coéquipiers IA.
- Lobby avec groupe, amis, boutique du jour, passe de combat, défis, casier, paramètres.

## Nouveautés v5 — Fidélité Chapitre 2 Saison 2

- **L'Agence** : tour recalée aux couleurs GHOST (calcaire, listels or, toits bleu nuit), drapeaux bleus sur la tour, emblème doré sur la façade.
- **Le Requin** : manoir blanc moderne à toits plats en porte-à-faux, baies vitrées, piscine sur la terrasse, phare rouge et blanc, hélipad sur pilotis, rochers en tête de requin et aileron au large.
- **Le Yacht** : coque à bande dorée et hublots, mât radar blanc et or, hélipad poupe cerclé de jaune avec marquage H, garde-corps dorés.
- **La Grotte** : anneau rocheux ouvert en ciel (style caverne à puits de lumière), porte blindée dorée gardée par des veilleuses rouges, cuves à carburant, conteneurs et tour de contrôle à fenêtres cyan.
- **La Plateforme** : plateforme pétrolière gris-bleu à bandes jaunes de flottaison, grue rouge avec flèche et contrepoids, hélipad jaune en porte-à-faux, passerelle treillis vers la station satellite (salle de contrôle).
- **Passe de combat Top Secret** : les agents de la saison en récompenses (Brutus, TNTina, Meowscles, Skye, Homme de main, Midas au palier 100... enfin 30).
- **Skye** : silhouette distincte (bonnet rose, cheveux bruns) au lieu du clone du Lapin.

## Nouveautés v4 — Saison Espions (inspirée du Chapitre 2 Saison 2)

- **5 POI espions** : L'Agence (tour noire et or au centre de l'île, statue dorée, hélipad), Le Requin (île avec mâchoires de requin à l'entrée), Le Yacht (navire blanc et or amarré sur son île), La Grotte (bunker béton ceinturé d'un mur), La Plateforme (plateforme pétrolière sur pilotis avec trampolines d'accès).
- **Boss mythiques** : Midas (Mitrailleuse de Midas), Skye (AR de Skye), Meowscles (AR Lourd Peow Peow), Brutus (Minigun de Brutus) et TNTina (Arc Ka-Boom). Chaque boss patrouille son POI avec ses hommes de main, a une étiquette dorée et une réserve de points de vie et de bouclier bien supérieure. Éliminé, il lâche **son arme mythique + une carte d'accès**.
- **Hommes de main** : PNJ en costume qui patrouillent les POI espions, ripèrent quand on les attaque (tout le POI est alerté) et ne comptent pas dans les joueurs restants ni le classement.
- **Coffres-forts** : chaque POI espion abrite un coffre-fort doré verrouillé. Il faut la carte du boss pour l'ouvrir ; avec la carte en poche, une **ligne bleue pointillée** sur la minicarte et la grande carte indique le chemin. Butin garanti : 2 coffres-forts (armes rares+), potions, munitions, matériaux.
- **Déguisement** : les cabines téléphoniques rouges des POI espions donnent le costume d'homme de main. Déguisé, les hommes de main t'ignorent — mais tirer ou prendre des dégâts **casse le déguisement**.
- **Armes mythiques** : nouvelle rareté Mythique (dorée) au-delà du Légendaire, avec 6 armes de boss dont l'Arc Ka-Boom (explosion de zone) et le Grappin de Skye (câble qui t'attire vers le point d'impact — caché dans le coffre-fort du Requin).
- **Cosmétiques** : nouveaux skins Midas, Brutus, Skye, TNTina, Meowscles et Homme de main (chapeau fedora), disponibles à la boutique.

## Nouveautés v3

- Lobby avec illustration de l'île en fond, parallaxe à la souris, éclairs de tempête, panneaux translucides.
- Pause corrigée : Échap ouvre le menu, Reprendre ou Échap relance la partie.
- Maisons détaillées (fenêtres encadrées, volets, jardinières, porches, toits à deux pans, cheminées, meubles).
- Immeubles de 3 à 5 étages avec rampes intérieures jusqu'au toit, quartier Tours Tempête.
- Glissade en sprint, herbe et fleurs animées par le vent, eau animée avec reflets.
