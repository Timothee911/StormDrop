# StormDrop

Battle royale web complet en Three.js, jouable dans le navigateur et installable en PWA (fonctionne hors ligne après la première ouverture). Aucun CDN requis : Three.js est embarqué dans `vendor/`.

## Saison Espions (v4)

Inspirée du Chapitre 2 Saison 2 de Fortnite : cinq POI espions (L'Agence, Le Requin, Le Yacht, La Grotte, La Plateforme) patrouillés par des Ombres et cinq boss mythiques (Midas, Skye, Meowscles, Brutus, TNTina). Quand personne n'est détecté, Ombres et boss rejouent leur routine de patrouille fixe (toujours les mêmes endroits). Les boss lâchent une arme mythique et une carte d'accès qui ouvre le coffre-fort de leur POI (ligne bleue guide sur la carte). Les cabines téléphoniques rouges donnent un déguisement d'Ombre — tirer ou être touché le casse.

L'Agence a été repensée : marbre clair (plus aucun noir), colonnes gris perle, intérieur lumineux, et deux coffres par étage (1er, 2e, 3e) en plus du hall. Les bots contourne­nt désormais les murs au lieu de s'y bloquer.

### Cohérence des lieux : Le Requin et L'Agence

- Le Requin : tête et falaise rocheuses facettées, passage libre entre les dents, villa avec 14 vraies baies transparentes et encadrements, balcon raccordé au plancher, garde-corps solides sur le balcon et le toit.
- Circulation : promenade dallée entre les accès, ponton accessible sans saut avec dix pieux latéraux ancrés, hélipad soutenu, coffre-fort intégré à un affleurement sans condamner sa porte.
- Ambiance : coin plage sablé, cascade avec source aménagée et bassin bordé de pierre. Les volumes restent stylisés pour s'intégrer au jeu existant.
- L'Agence : garde-corps de l'atrium fixés aux dalles jusqu'au toit, jardinières sur les podiums, stationnement de service et voiture à la même échelle que ses collisions, roues réorientées et faisceaux de projecteurs plus discrets le jour.
- QA dédiée : `node .github/scripts/qa-poi-coherence.cjs` (serveur local sur le port 8090, ou variable `QA_URL`) vérifie les accès au clavier, les collisions, les vitrages et les éléments de gameplay conservés.

La Plateforme flotte désormais EN PLEINE MER (l'îlot dessous a été retiré du terrain) : vraie plate-forme pétrolière avec quatre pieds géants ancrés sur les fonds marins, entretoisements en X, pont 32x24 avec garde-corps jaunes et lignes de sécurité peintes, tour de forage à croisillons, grue rouge, hélipad en porte-à-faux, torchère à flamme vivante, canot de sauvetage et passerelle vers la station de contrôle. La mini-carte a été refaite : pré-rendu 1024px avec relief ombré (lumière nord-ouest), forêts mouchetées, écume sur la ligne de rivage, empreintes de tous les bâtiments (dont les POI espions), icônes dédiées par POI (étoile, aileron, yacht, crâne, derrick), grille et échelle sur la grande carte, rose nord sur la mini-carte.

## Contenu

- Construction sur grille (bois / pierre / métal) à 5 matériaux, édition 3x3 (toit de la même texture que les murs), tir ADS, 6 raretés d'armes dont la mythique, tempête en phases, bus de combat, planeur, véhicules, trampolines et cheminées d'air.
- Physique sur tous les objets : mobilier, coffres, caisses de munitions, largages, pads, cheminées d'air et décor des POI sont solides (murs fins infranchissables même à grande vitesse grâce aux sous-pas).
- La zone apparaît 1 min après la fin du bus, bouge pour la première fois 2 min après son activation et se referme bien plus lentement ; dégâts 1, puis 2 à la moitié des joueurs, 5 au quart, 15 à 5 survivants.
- Chute libre tête en avant les mains vides (la pioche ne sort qu'après la réception) et mains accrochées aux poignées du parachute à l'ouverture.
- Passe de combat : 10 000 XP par niveau, boutique quotidienne couvrant les cinq catégories (tenues, sacs à dos, pioches, planeurs, emotes), tenue de base : la Recrue.
- 50 / 100 joueurs, Solo / Duo / Escouade avec coéquipiers IA, lobby complet (boutique, passe de combat, défis, casier, paramètres, touches AZERTY/QWERTY).

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000. Voir [LISEZMOI.md](LISEZMOI.md) pour les commandes détaillées.

## Qualité

Le workflow GitHub Actions (`.github/workflows/qa.yml`) vérifie chaque push : lint du JS, chargement du lobby et du jeu dans un navigateur headless, absence d'erreur JS et de 404, boucle de rendu WebGL réellement instrumentée.
