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
