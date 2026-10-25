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
