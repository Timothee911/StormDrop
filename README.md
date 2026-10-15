# StormDrop

Battle royale web complet en Three.js, jouable dans le navigateur et installable en PWA (fonctionne hors ligne après la première ouverture). Aucun CDN requis : Three.js est embarqué dans `vendor/`.

## Saison Espions (v4)

Inspirée du Chapitre 2 Saison 2 de Fortnite : cinq POI espions (L'Agence, Le Requin, Le Yacht, La Grotte, La Plateforme) patrouillés par des hommes de main et cinq boss mythiques (Midas, Skye, Meowscles, Brutus, TNTina). Les boss lâchent une arme mythique et une carte d'accès qui ouvre le coffre-fort de leur POI (ligne bleue guide sur la carte). Les cabines téléphoniques rouges donnent un déguisement d'homme de main — tirer ou être touché le casse.

## Contenu

- Construction sur grille (bois / pierre / métal) avec édition 3x3, tir ADS, 6 raretés d'armes dont la mythique, tempête en phases, bus de combat, planeur, véhicules, trampolines et cheminées d'air.
- 30 / 50 / 100 joueurs, Solo / Duo / Escouade avec coéquipiers IA, lobby complet (boutique, passe de combat, défis, casier, paramètres, touches AZERTY/QWERTY).

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000. Voir [LISEZMOI.md](LISEZMOI.md) pour les commandes détaillées.

## Qualité

Le workflow GitHub Actions (`.github/workflows/qa.yml`) vérifie chaque push : lint du JS, chargement du lobby et du jeu dans un navigateur headless, absence d'erreur JS et de 404, boucle de rendu WebGL réellement instrumentée.
