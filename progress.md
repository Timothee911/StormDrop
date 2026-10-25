Original prompt: Ajoute des bots aux comportements variés. Refait l'agence pour qu'il ressemble vraiment à l'agence de fortnite chapitre 2 saison 2. Le coffre fort ne doit plus être dehors mais à l'intérieur de l'agence.

## Scope
- Preserve existing lobby, controls, saves, weapons and other spy POIs.
- Add assaut, sniper, constructeur, prudent and flanqueur AI profiles.
- Rebuild the Agency with a walkable basement vault and interior staircase.
- Reference: https://screenrant.com/fortnite-new-map-locations-chapter-2-season-2/

## Baseline
- Lobby and game iframe loaded in Chromium without page errors.
- Existing vault placement is random outside the generic Agency tower.

## Implementation
- Five balanced profiles distributed round-robin among player bots and AI teammates.
- Profile-dependent preferred weapon, range, lateral movement, persistent flanking direction, burst, retreat and construction decisions.
- Storm escape and teammate regroup override fighting and construction; friendly damage does not trigger retaliation.
- Bespoke Agency module replaces the generic tower: stepped limestone facade, curved bastions, vertical window bays, circular medallions, blue flags, reception, office floors, roof access, forecourt and helipad.
- Raised Agency foundation keeps the basement dry; terrain, physics and hitscan use the same excavation.
- One fixed basement vault, 4.2m below the hall, with a split floor and smooth stair collider. Midas card and loot preserved.
- Boss and guards explicitly placed at safe interior/exterior patrol posts.
- Service-worker version v29 caches both new modules.

## Validation
- All JavaScript syntax and git diff whitespace checks passed.
- Profile unit test passed.
- New Puppeteer regression passed: five profiles, five vaults, dry basement, boss placement, physical walk from outside to basement and back, missing/wrong/correct keycards, entry and looting, low-health retreat and storm priority; no page errors.
- Interactive desktop checks: all lobby tabs, mode picker, pause/resume, map toggle; no page errors.
- Desktop exterior, vault interior and 375px lobby/game screenshots inspected.
- Software-WebGL parallel rendering saturated the QA machine initially. Resolved by closing the duplicate browser and using deterministic simulation steps; production frame loop unchanged.

## Limits
- Procedural low-poly interpretation of the reference, not imported Fortnite assets or a 1:1 replica.
- Long-match balance, all possible player-built obstructions and extended mobile touch play require human playtesting.

## Underground expansion
- Follow-up: « Continue d'améliorer l'agence avec des sous sol, plein de tuyaux. […] refait la salle du coffre fort, la porte qui s'ouvre. »
- Added a second dry technical basement and an east stairwell; preserved the original hall/B1 staircase.
- Industrial pipe runs, valves, cable trays, generators, boilers, security consoles and French wayfinding signs; clear stair shafts and walkable central passages.
- Steel-toned floors and ceiling panels, with underground lighting reusing the fixed light pool rather than increasing shader light counts.
- Dedicated circular vault room: thick hinged leaf, wheel, retracting bolts, red/amber/green card reader, gold shelves, three locked chests and two ammo crates.
- Sequence: scan, unlock, inward swing, then reward and release loot. The leaf remains solid and visible; repeated interaction cannot duplicate XP.
- Service-worker v30 caches all three new modules; deeper terrain excavation and a geometric hole in the sea surface keep B2 dry below sea level, including its rendered appearance.
- Regression passes: physical entrance/B1/vault/exit and B1/B2 round trips, no/wrong/correct card, scan/open intermediate states, sealed loot, persistent door and one-time XP; five bot profiles and storm priority still pass with no page errors.
- Pure mechanism tests cover phase boundaries, wheel/bolt movement, monotonic hinge angle and completion.
- Full C2S2 browser regression passes: five spy POIs/vaults/bosses, henchmen, player counter, disguise, weapons, boss loot/XP, keycards, grapple and victory; no JS errors.
- The legacy test now controls RAF and advances simulation without hundreds of redundant renders during landing. Production frame scheduling is unchanged.
- Deployed preview checked in a fresh context: lobby navigation and launch, 35 pipe runs / 16 valves, B2 geometry, card input and a fully opened vault whose hinged leaf remains visible and solid.
- References: https://www.thegamer.com/fortnites-chapter-2-season-2-vault-locations-unlock-guide/ and https://screenrant.com/fortnite-vault-key-cards-chapter-2-season-2/

## Building and grass textures
- Request: « Refait la texture des bâtiments et de l'herbe ».
- Original deterministic canvas atlas (1024×512) and seamless grass detail (512×512), generated locally without external assets or consuming the world's RNG.
- Explicit per-vertex material IDs survive static batching and wall destruction. Pastel blue timber is no longer classified as glass; Agency limestone is not misclassified as brick. Curved bastions and stone mouldings are included.
- World-space wood siding, staggered bricks, ashlar, plaster, roof tiles, metal panels and concrete; subtle relief/roughness and metre-scale repeats.
- Meadow palette and grass instances harmonized; near-field blade detail fades at distance and is masked away from sand/snow/rock.
- No extra scene meshes or draw calls for surface detail. Two shared detail textures, cached by service-worker v31; legacy build-piece textures and all gameplay geometry remain unchanged.
- Added browser regression for deterministic pixels, distinct atlas tiles/orientation, material IDs, blue timber, Agency stone, rebatching after damage, walking and low/high shader compilation.
- Validation: texture regression, Agency/B1/B2/vault/bot regression, full C2S2 gameplay regression and pure bot/vault units pass. No shader compilation or console errors; syntax and diff checks pass.

## Tree and rock detail textures
- Request: « Ajoute des textures plus détaillées aux arbres et aux rochers ».
- Three original deterministic 512×512 repeating canvas detail maps: grooved/knotted bark, layered pine sprigs, mineral aggregate and fine fractures.
- Dedicated instanced materials use instance scale and rotation correctly; cylindrical bark and triplanar foliage/stone avoid stretched rock UVs. Original snowy crown instance colours are retained.
- Slight surface relief, rock-top moss tint and distance fade. Crown/lower foliage share one material; no extra meshes or draw calls, no world RNG consumption and no external downloads.
- Original tree/rock geometry, instance IDs, placement, collision and harvesting logic are unchanged. Cacti are outside this texture refresh.
- Service worker v32 invalidates cached modules. Added low/high nature regression to CI: deterministic pixels, material sharing, instancing, ray picking, wood/stone gains and hiding a harvested non-first instance without hiding its neighbour.
- Fixed both texture QA loaders to reload the document when switching quality (a fragment-only navigation does not reinitialize Three.js).
- Validation: nature, building/grass, Agency/bots, complete C2S2 and bot/vault unit suites pass. Real mouse/keyboard harvesting grants wood and stone and removes the hit instances; no console/shader errors.
- Inspected close-up foliage/bark, rock and snowy crown screenshots. Desktop/375px resize renders the new surfaces; existing narrow-screen HUD overlaps are unchanged and are not part of this texture change.

## Sculpted branches and stronger rock fissures
- Request: « Ajoute des branches aux arbres et davantage de fissures aux rochers pour devenir plus proche de Fortnite ».
- Four asymmetrical crooked/forked branches (12 tapered segments) merged into the reusable trunk geometry, with its bark material. Existing instance transforms, map RNG, tree IDs and three-mesh harvesting pipeline retained; no extra draw calls.
- Branches participate in the existing tree ray picking and disappear with their parent tree. Root colliders remain narrow to avoid large invisible movement blockers beneath the canopy.
- Rock detail expanded to 40 fine fracture chains plus seven broad jagged cracks with two offshoots each (61 chains total), dark interiors and highlighted edges.
- Fissure depth packed in the existing rock texture's alpha channel, preserving RGB at alpha >= 128; triplanar sampling reuses the same texture reads. Larger pattern scale and extra groove contrast make fractures readable from normal play distance.
- Nature library/shader v2; offline cache v33 includes the new tree geometry module. Added branch picking, geometry bounds, finite vertices, fracture mask coverage and destruction checks to the low/high regression.
- Low/high nature regression passes: 448 vertices per shared trunk, four branch groups, 12 tapered segments, branch-targeted melee grants wood, tree and rock destruction/collider removal remain correct. Intact-stone/fissure mask coverage verified; no shader/console errors.
- Agency/bots, building/grass, full C2S2 gameplay and pure bot/vault regression suites pass. Real mouse harvesting removes all trunk/branch/foliage instances and grants wood; screenshots of green/snowy trees, fissured rocks and 375px resize inspected. Existing narrow-screen HUD overlaps unchanged.

## Broadleaf trees mixed with pines
- Request: « Ajoute des arbres feuillus plus larges en complément des sapins ».
- Added rounded multilobed crowns (five lower/three upper dodecahedral lobes), with thicker/taller forked trunks and wider, lower silhouettes than pines.
- A deterministic coordinate hash selects broadleaf trees for 42% of temperate candidates without consuming map RNG or moving existing roots/rocks. Snow-weight > .3 stays pine; desert cacti unchanged.
- New original 512×512 oval-leaf/vein texture distinct from pine needles, with deeper green instance colours. Four shared nature textures; library/shader v3 and service worker v34.
- Compact lower/upper foliage batches per species add only two forest-wide draw calls, not meshes per tree. The common trunk keeps global tree IDs; each tree carries per-part instance indices so ray picking, harvesting and vehicle destruction target the correct compact batch entries.
- Trunk colliders match the thicker broadleaf roots without blocking the entire wide crown. Both species keep 150 HP and the existing wood/weak-point mechanics.
- Validation: low/high nature regression passes with both species present, deterministic four-texture generation, compact index mapping, crown ray picking, branch harvesting, complete destruction and untouched neighbours (including matching foliage indices across species).
- Real mouse harvesting of a non-first broadleaf (different global/foliage indices) grants wood and hides exactly its three owned parts; cactus fallback harvesting also passes. Agency/bots, building/grass, full C2S2 and pure bot/vault suites pass with no JS/shader errors.
- Broadleaf desktop and 375px screenshots inspected; resize renders correctly. Existing narrow-screen HUD overlaps remain outside this tree pass.
