# StormDrop

Battle royale web complet en Three.js, jouable dans le navigateur et installable en PWA (fonctionne hors ligne après la première ouverture). Aucun CDN requis : Three.js est embarqué dans `vendor/`.

## Saison Espions (v4)

Inspirée du Chapitre 2 Saison 2 de Fortnite : cinq POI espions (L'Agence, Le Requin, Le Yacht, La Grotte, La Plateforme) patrouillés par des hommes de main et cinq boss mythiques (Midas, Skye, Meowscles, Brutus, TNTina). Les boss lâchent une arme mythique et une carte d'accès qui ouvre le coffre-fort de leur POI (ligne bleue guide sur la carte). Les cabines téléphoniques rouges donnent un déguisement d'homme de main — tirer ou être touché le casse.

## Contenu

- Textures originales des bâtiments : bois peint, briques, enduit, pierre claire de l'Agence, toitures et surfaces techniques. Les matériaux sont attribués explicitement et restent corrects après destruction d'un mur.
- Herbe retravaillée : grain de brins visible à courte distance, petites variations de teinte et zones plus sèches, avec détails atténués au loin. Les biomes sableux et enneigés conservent leur aspect.
- Arbres et rochers détaillés : quatre branches en volume, coudées et fourchues par arbre, écorce rainurée, rameaux et aiguilles de pin. Les rochers ont du grain minéral, des fissures fines et de larges crevasses ramifiées à bords éclaircis. Trois textures procédurales partagées ; branches fusionnées avec le tronc pour conserver le même nombre d'appels de dessin et le système de récolte.

- Bots à cinq profils tactiques : assaut, sniper, constructeur, prudent et flanqueur. Distances, armes recherchées, rafales, repli et construction varient selon le profil ; la zone et le regroupement restent prioritaires.
- Agence reconstruite : ailes en pierre claire, bastions arrondis, fenêtres verticales, drapeaux bleus, hall sur deux niveaux et étages accessibles. Son coffre-fort est dans un sous-sol fermé accessible par l'escalier intérieur à gauche du hall ; la carte de Midas reste nécessaire.
- Deux niveaux souterrains : sécurité et salle du coffre en B1, générateurs et chaudières en B2. L'escalier à l'est du B1 dessert le B2 ; conduites colorées, vannes, gaines, plafonds métalliques et panneaux guident l'exploration.
- Salle du coffre refaite : porte circulaire épaisse, lecteur de carte latéral, volant, verrous rétractables et ouverture sur charnières en plusieurs étapes. Le battant reste visible et solide après ouverture ; les coffres, munitions et armes restent verrouillés jusqu'à la fin de la séquence.

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
