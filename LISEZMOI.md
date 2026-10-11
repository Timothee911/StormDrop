# STORMDROP — Battle Royale (v3)

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

## Nouveautés v3

- Lobby avec illustration de l'île en fond, parallaxe à la souris, éclairs de tempête, panneaux translucides.
- Pause corrigée : Échap ouvre le menu, Reprendre ou Échap relance la partie.
- Maisons détaillées (fenêtres encadrées, volets, jardinières, porches, toits à deux pans, cheminées, meubles).
- Immeubles de 3 à 5 étages avec rampes intérieures jusqu'au toit, quartier Tours Tempête.
- Glissade en sprint, herbe et fleurs animées par le vent, eau animée avec reflets.
