# StormDrop

Battle royale web complet en Three.js, jouable dans le navigateur et installable en PWA (fonctionne hors ligne après la première ouverture). Aucun CDN requis : Three.js est embarqué dans `vendor/`.

## Saison Espions (v4)

Inspirée du Chapitre 2 Saison 2 de Fortnite : cinq POI espions (L'Agence, Le Requin, Le Yacht, La Grotte, La Plateforme) patrouillés par des Ombres et cinq boss mythiques (Midas, Skye, Meowscles, Brutus, TNTina). Chaque boss et chaque Ombre possède désormais son circuit propre : 22 rondes spatialement distinctes, avec des secteurs et des vitesses différents. Les boss lâchent une arme mythique et une carte d'accès qui ouvre le coffre-fort de leur POI (ligne bleue guide sur la carte). Les cabines téléphoniques rouges donnent un déguisement d'Ombre ; tirer ou être touché le casse.

## Nature (pack 3D)

- Arbres, sapins (enneigés en toundra), arbres morts, arbres tortueux rouges, rochers, buissons, fougères, fleurs, champignons, hautes herbes et cailloux viennent du pack « Stylized Nature MegaKit ».
- `tools/nature2js.py` convertit les `.glb` (86 Mo) en `js/nature.js` et `img/nature/` (0,9 Mo) : troncs simplifiés, feuillage éclairci, version lointaine de chaque arbre.
- `js/flora.js` les dessine par instances : arbres détaillés près de la caméra, simplifiés au loin ; petites plantes autour de la caméra seulement. Le feuillage collé à la caméra se dissout pour ne pas boucher la vue.
- Les tirs et la récolte utilisent des volumes simples invisibles ; les buissons et plantes n'ont pas de collision.

## Meubles (pack 3D)

- Maisons et immeubles sont meublés avec l'« Office Pack » : bureaux équipés, canapés, fauteuils, bibliothèques, armoires, salles d'eau, cartons, plantes, distributeurs, fontaines, imprimantes, lampes. Les immeubles mélangent étages de bureaux et logements.
- `tools/meubles2js.py` remet chaque modèle à l'échelle, le simplifie et met ses couleurs dans les sommets (`js/meubles.js`, 0,5 Mo, aucune image).
- Murs intérieurs : tableaux, horloges, panneaux, étagères, cibles, calendriers, rideaux, stores, interrupteurs et prises, jamais sur une porte, une fenêtre ou la cage d'escalier. Un mur détruit emporte ce qui y est accroché.
- Les gros meubles sont solides, les petits objets sont décoratifs. Un meuble n'est dessiné qu'à proximité de la caméra.

## Feel de la pioche

- **Sons d'impact différenciés** : l'audio reste 100 % synthétisé, mais chaque matériau (bois, pierre, métal) a sa signature — pitch, filtration, résonance — et les crits montent le tout d'un cran. Chaque coup est légèrement détuné au hasard pour ne jamais sonner deux fois pareil.
- **Aspiration du loot** : les matériaux récoltés (arbres, rochers, murs, butin au sol) volent en arc depuis le point de récolte jusqu'à leur compteur HUD, qui pulse à chaque arrivée avec un petit « plip ». Le total affiché rattrape la valeur réelle au fil des arrivées ; une dépense recolle immédiatement.
- **Traînée de frappe** : un arc lumineux en éventail suit la tête de la pioche pendant le coup (ruban additif, comme l'anneau d'impact), étroit à la queue et large à la tête, lisible même à distance. Il claque au moment de la frappe puis s'éteint vite au retour.

Le script `.github/scripts/qa-loot-trail.cjs` couvre ces trois ajouts : visibilité du ruban pendant le coup, vol des icônes et rattrapage du compteur, câblage des six variantes de sons.

## Jeu d'équipe : à terre, réanimation, siphon et pings

- **À terre (Duo / Escouade)** : tomber à 0 PV alors qu'un coéquipier tient encore debout met à terre au lieu d'éliminer. On rampe lentement, sans arme ni construction, pendant que la jauge de saignement (100) fond toute seule (environ 22 s) ; les balles et la tempête l'entament aussi. Quand plus personne n'est debout dans l'équipe, tous les blessés sont éliminés d'un coup. Les ennemis visent plus bas pour achever un joueur à terre.
- **Réanimation** : <kbd>E</kbd> près d'un coéquipier à terre lance 5 s de réanimation (barre orange, le saignement est suspendu) ; tirer, construire ou s'éloigner l'interrompt. Il revient avec 30 PV. Les IA (alliées comme ennemies) vont relever leurs blessés quand leur cible ne les voit pas, et les blessés rampent vers le coéquipier le plus proche. +150 XP par réanimation, +75 XP par mise à terre.
- **Siphon** : chaque élimination rend 50 (PV d'abord, puis bouclier), ce qui récompense l'agressivité.
- **Pings** : la touche marqueur (<kbd>N</kbd>, renommée « Ping / marqueur ») signale d'abord un ennemi près du réticule (étiquette rouge qui le suit 8 s, les coéquipiers IA l'engagent), puis une arme, un coffre ou un largage (étiquette bleue, ils vont la chercher), sinon elle pose le marqueur de lieu jaune, que les coéquipiers rejoignent. Les pings apparaissent aussi sur la mini-carte.
- **QA** : `.github/scripts/qa-revive-ping.cjs` (15 contrôles) couvre la mise à terre, le saignement, la réanimation par l'IA et par le joueur, l'élimination en cascade, le siphon et les trois sortes de pings.

## La Grotte : base de l'Ombre sous la montagne

Refaite pour se rapprocher de la Grotte du Chapitre 2 Saison 2 :

- **Montagne rocheuse** : roche brun-gris nue avec de la mousse sur les replats (plus de neige ni de sapins), sommet en cratère.
- **Le puits** : une grande ouverture au fond du cratère, bordée d'un cadre noir à bandes jaunes et de feux rouges, plonge droit dans la caverne. On s'y jette depuis le sommet et on atterrit sur la cible rouge sans dégâts de chute.
- **Deux entrées** : le puits par le haut, et la bouche du crâne géant à pied sec, au bout du canyon côté océan.
- **Base de l'Ombre** : bâtiment de métal noir sur deux niveaux adossé à la paroi nord. Au rez-de-chaussée, une armurerie vitrée avec des écrans ; à l'étage, une salle de contrôle et le bureau noir et or de Brutus. Un escalier y monte, et une passerelle traverse la caverne jusqu'au tablier du mur sud.
- **Lagon intérieur** : bassin d'eau de mer alimenté par la cascade, éclairé en cyan, avec une vedette de l'Ombre amarrée et un escalier immergé pour en ressortir à la nage.
- **Coffre-fort** déplacé dans le coin sud-est de la salle.
- **QA** : la section Grotte de `qa-c2s2.cjs` vérifie plusieurs choses :
  - la voûte couvre la salle partout sauf au-dessus du puits, qui s'ouvre jusqu'au ciel ;
  - le saut dans le puits se fait sans dégâts ;
  - on peut nager dans le lagon et en ressortir ;
  - l'escalier de la base, le pont supérieur et la passerelle sont praticables ;
  - le canyon se remonte toujours à pied sec ;
  - on ne traverse jamais la roche du flanc ouest.

## Hélico de combat et nouveau sol

- **Hélico de combat** : le bus de combat est remplacé par un hélicoptère militaire kaki à bandes jaunes. Il a un cockpit vitré, des portes latérales ouvertes avec mitrailleuses, des ailerons à paniers de roquettes, un canon sous le nez et des patins. Le rotor principal et le rotor de queue tournent, l'appareil vole nez légèrement piqué, et on entend le « tchop » des pales. Le trajet, le saut et le compte à rebours de la zone ne changent pas.
- **Herbe** : trois verts mélangés à grande échelle. Au sol, le shader dessine des brins, des creux sombres entre les touffes, des pointes éclairées, du trèfle et de petites fleurs des champs. Les touffes en 3D ont des pieds plus sombres et des pointes plus claires.
- **Terre** : plaques de terre battue dans les prairies et sentiers sinueux à travers l'île, avec un bord irrégulier contre l'herbe. On y voit des mottes, des cailloux, des fissures et quelques pousses. Aucune touffe d'herbe ne pousse sur la terre.

## Ciel et tenues de l'Ombre

- **Ciel procédural** : tout est calculé dans un seul shader.
  - Dégradé du zénith vers l'horizon, avec un voile clair au ras de l'eau.
  - Soleil : disque net au bord assombri et halo de diffusion.
  - Lever et coucher : la lumière chaude se concentre du côté du soleil.
  - Cirrus : voiles d'altitude qui dérivent lentement.
- **Nuit** :
  - étoiles qui scintillent, de couleurs variées, et Voie lactée ;
  - lune cratérisée avec son halo, à l'opposé du soleil ;
  - aurore discrète vers le nord.
- **Couleurs du ciel** : elles sont maintenant encodées correctement à l'écran. Avant, le bleu sortait trop saturé.
- **Nuages** : dessous ombré, teinte qui suit l'heure (blancs le jour, dorés au crépuscule, gris-bleu la nuit).
- **Reflets dans l'eau** : la mer reflète le soleil le jour et la lune la nuit.
- **Tenues de l'Ombre** : trois tenues complètes remplacent l'ancien déguisement fait de boîtes. Chaque cabine téléphonique fournit la sienne, et son nom s'affiche dans le bandeau « DÉGUISEMENT ».
  - **Agent de l'Ombre** : costume noir, revers satinés, chemise blanche, cravate, pochette, oreillette, chapeau, lunettes noires, richelieus vernis.
  - **Garde de l'Ombre** : cagoule, lunettes de vision nocturne, casque radio, gilet pare-balles et porte-chargeurs, radio, brassard rouge, holster de cuisse, rangers.
  - **Officier de l'Ombre** : manteau long croisé à boutons dorés, épaulettes à franges, écharpe rouge, ceinturon, casquette d'officier, bottes cavalières.
- **Animations** : la tenue suit toutes les animations du joueur (articulations recopiées à chaque image), et l'arme reste en main.
- **Hommes de main** : ils portent les trois mêmes tenues.

## Eau et neige refaites

- **Flottaison** : plus de hauteur fixe. On flotte grâce à une poussée d'Archimède amortie qui suit la houle de la mer (même formule que le shader de l'eau). Le nageur monte et descend avec les vagues.
- **Plongeon et plongée** : un saut de haut dans l'eau profonde ne blesse pas. On s'enfonce de plusieurs mètres puis on remonte en douceur. La touche s'accroupir fait plonger jusqu'au fond, en relâchant ou avec SAUT on remonte. Dans l'eau, l'élan se garde : on accélère et on freine plus lentement.
- **Pataugeage** : en eau peu profonde on marche au fond, ralenti selon la hauteur d'eau, et on saute moins haut. Chaque pas fait une gerbe et un anneau.
- **Animations de nage** :
  - sur place : jambes en batteur à œufs et mains qui godillent ;
  - crawl : roulis du corps, la tête tourne pour respirer, écume aux mains, sillage ;
  - plongée : brasse sous l'eau avec ciseau des jambes, le corps s'incline selon qu'on descend ou remonte, bulles d'air ;
  - en eau peu profonde : genoux levés ;
  - en sortant de l'eau : gouttes qui tombent du corps.
- **Lagon de la Grotte** : eau calme, sans houle. Un nageur peut se hisser sur un rebord qui affleure (quai, marche immergée).
- **Neige** : le sol enneigé est dessiné par le shader. On y voit :
  - un bord irrégulier où l'herbe d'altitude perce ;
  - des congères, des rides de vent et des ombres bleues dans les pentes ;
  - des plaques de glace et des paillettes qui scintillent au soleil.
- **Sapins enneigés** : chaque étage porte une calotte de neige au bord irrégulier.
- **Flocons et traces** : des flocons tombent au-dessus du massif enneigé, pas ailleurs. Chaque pas laisse une empreinte qui s'efface et une bouffée de poudreuse.
- **QA** : `.github/scripts/qa-water-snow.cjs` contient 10 contrôles :
  - flottaison sur la houle ;
  - plongeon de 20 m sans dégâts ;
  - plongée puis remontée ;
  - passage nage, pataugeage, terre ferme ;
  - flocons et empreintes dans la neige.

## Agence, voitures et eau

- **Sous-sol B1** : archives et local technique séparés, couloir vers le coffre, poteaux, conduites, éclairage, signalétique et garde-corps d'escalier. Les deux pièces, le scanner et la remontée au hall sont accessibles sans saut.
- **Vie des voitures** : 800 PV, affichés immédiatement dans une barre orange au-dessus du bouclier et de la vie. Tirs, explosions et chocs importants endommagent le véhicule ; une épave éjecte son conducteur et ne peut plus être conduite.
- **Vitrage** : six panneaux transparents par voiture, habitacle visible et vitres cassables sous les tirs du joueur comme des bots. La voiture de service GHOST de l'Agence utilise aussi le modèle conduisible.
- **Dans l'eau** : maintien vertical à l'arrêt ou pendant le tir, arme visible en visée et battements de jambes continus. Le crawl en déplacement et la plongée restent disponibles.

Les scripts `.github/scripts/qa-poi-coherence.cjs` et `.github/scripts/qa-vehicles-water-patrols.cjs` couvrent ces modifications : 49 contrôles ciblés, dont des déplacements au clavier, des tirs, des dégâts de collision et d'explosion, et l'affichage à 375 px. Ils complètent les autres suites de tests du projet.

L'Agence a été repensée : marbre clair (plus aucun noir), colonnes gris perle, intérieur lumineux, et deux coffres par étage (1er, 2e, 3e) en plus du hall. Les bots contourne­nt désormais les murs au lieu de s'y bloquer.

### Cohérence des lieux : Le Requin et L'Agence

- Le Requin : tête et falaise rocheuses facettées, passage libre entre les dents, villa avec 14 vraies baies transparentes et encadrements, balcon raccordé au plancher, garde-corps solides sur le balcon et le toit.
- Circulation : promenade dallée entre les accès, ponton accessible sans saut avec dix pieux latéraux ancrés, hélipad soutenu, coffre-fort intégré à un affleurement sans condamner sa porte.
- Ambiance : coin plage sablé, cascade avec source aménagée et bassin bordé de pierre. Les volumes restent stylisés pour s'intégrer au jeu existant.
- L'Agence : garde-corps de l'atrium fixés aux dalles jusqu'au toit, jardinières sur les podiums, stationnement de service et voiture à la même échelle que ses collisions, roues réorientées et faisceaux de projecteurs plus discrets le jour.
- QA dédiée : `node .github/scripts/qa-poi-coherence.cjs` (serveur local sur le port 8090, ou variable `QA_URL`) vérifie les accès au clavier, les collisions, les vitrages et les éléments de gameplay conservés.

La Plateforme flotte désormais EN PLEINE MER (l'îlot dessous a été retiré du terrain) : vraie plate-forme pétrolière avec quatre pieds géants ancrés sur les fonds marins, entretoisements en X, pont 32x24 avec garde-corps jaunes et lignes de sécurité peintes, tour de forage à croisillons, grue rouge, hélipad en porte-à-faux, torchère à flamme vivante, canot de sauvetage et passerelle vers la station de contrôle. La mini-carte a été refaite : pré-rendu 1024px avec relief ombré (lumière nord-ouest), forêts mouchetées, écume sur la ligne de rivage, empreintes de tous les bâtiments (dont les POI espions), icônes dédiées par POI (étoile, aileron, yacht, crâne, derrick), grille et échelle sur la grande carte, rose nord sur la mini-carte.

## Contenu

- Construction sur grille (bois / pierre / métal) à 5 matériaux, édition 3x3 (toit de la même texture que les murs), tir ADS, 6 raretés d'armes dont la mythique, tempête en phases, hélico de combat, planeur, véhicules, trampolines et cheminées d'air.
- Physique sur tous les objets : mobilier, coffres, caisses de munitions, largages, pads, cheminées d'air et décor des POI sont solides (murs fins infranchissables même à grande vitesse grâce aux sous-pas).
- La zone apparaît 1 min après le passage de l'hélico, bouge pour la première fois 2 min après son activation et se referme bien plus lentement ; dégâts 1, puis 2 à la moitié des joueurs, 5 au quart, 15 à 5 survivants.
- Chute libre tête en avant les mains vides (la pioche ne sort qu'après la réception) et mains accrochées aux poignées du parachute à l'ouverture.
- Passe de combat : 10 000 XP par niveau. Écran d'accueil avec le héros de la saison au centre, récompenses obtenues et pages terminées à gauche, niveau (barre segmentée), achat de niveau, Passe Premium et prochaine récompense à droite, et cinq catégories en bas (récompenses du passe, piste gratuite, piste premium, pass bonus, pass quête). Une récompense par niveau, en pages de 6 (2 gratuites : il suffit d'atteindre le niveau indiqué ; 4 premium : niveau + Passe Premium). Pages de catégorie : infos à gauche, personnage au centre, niveau et achats à droite, récompenses en bas avec pagination. Boutique quotidienne couvrant les cinq catégories (tenues, sacs à dos, pioches, planeurs, emotes), tenue de base : la Recrue.
- 50 / 100 joueurs, Solo / Duo / Escouade avec coéquipiers IA, lobby complet (boutique, passe de combat, défis, casier, paramètres, touches AZERTY/QWERTY).

## Lancer en local

```bash
python -m http.server 8000
```

Puis ouvrir http://localhost:8000. Voir [LISEZMOI.md](LISEZMOI.md) pour les commandes détaillées.

## Qualité

Le workflow GitHub Actions (`.github/workflows/qa.yml`) vérifie chaque push : lint du JS, chargement du lobby et du jeu dans un navigateur headless, absence d'erreur JS et de 404, boucle de rendu WebGL réellement instrumentée.
