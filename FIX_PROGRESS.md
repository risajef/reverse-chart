# Reverse Chart fix progress

Scope: findings in the 6 November 2026 review. Each fix is committed separately in this repository. Parent website sources, staged assets, and the parent submodule pointer are outside this work. No deployment or push is included.

| Finding | Status | Verification |
| --- | --- | --- |
| 1. Blank calibration becomes zero | Done | Native input validity and `valueAsNumber`; regression covers blank, malformed, explicit zero, and log zero rejection. |
| 2. Unusable fits reported as calibrated | Done | Pure centered regression, explicit fit/evaluation states, finite/range validation, residual diagnostics; linear/reversed/log/degenerate/extreme tests pass. |
| 3. Stale image completion overwrites session | Done | Load generations guard commits; candidate URLs release exactly once; controlled B→A completion and failed replacement tests pass. Basic decode-error handling added here; resource policy follows in fix 7. |
| 4. Invalid/incomplete CSV output | Done | Explicit X/Y/both selection; export rejects missing fits and invalid evaluated values; list identifies uncalibrated points. CSV regression cases pass. |
| 5. Recalibration semantics and provenance | Done | Current-calibration semantics and revision visible; versioned project save/open embeds PNG, dimensions, scales and points; strict validation and round-trip CSV tests pass. |
| 6. Point recovery and undo | Done | Remove by ID; bounded undo for point capture/removal, clear, scales, project/image replacement. Paste scoped to chart. Recovery and pending-load cancellation tests pass. |
| 7. Image errors and resource limits | Done | Persistent load status, decode errors, 32 MiB/16 MP/8192-side limits, backing-store preflight before commit, project dimension checks. Oversize/allocation failure tests preserve the prior session. |
| 8. Repeated fits and rendering work | Done | Fits cached by calibration revision; lists refresh only when their inputs change; pointer bursts coalesce per animation frame; palette read once per draw. Instrumented reuse/render tests pass. |
| Measurement marker visibility | Done | Captured markers render during hover; magnifier covers only its own circular region. Marker-render regression passes. |
| Accessibility | Done | Mode pressed states, polite status regions, visible keyboard/paste instructions and canvas description/fallback; visible upload/project-input focus. Semantic mode test passes; browser checks follow below. |
| Small-number display precision | Done | Significant-digit formatting with scientific notation for very small/large values; accuracy guidance; tiny/subnormal/zero tests pass. |
| Standalone documentation/theme | Done | README now documents this repository and its workflows; removed parent-owned stylesheet request so standalone serving needs only tracked runtime files. |
| Regression checks and browser smoke | Done | 20 regression cases across 10 files; real browser smoke, standalone npm scripts/lockfile and CI workflow added. All local checks pass. |

Run checks with `node --test tests/*.test.cjs` and `node --check app.js`.

## Project round-trip follow-up

Save now enforces the same schema and 64 MiB limit as Open. Session point limits match the import limits, and temporary PNG-encoding canvas backing stores are released. Regression checks cover save validity/size failure and capture limits. This follow-up is committed separately from the original provenance fix.

## Fix commits

| Finding | Commit |
| --- | --- |
| Blank/invalid calibration | `269ce1b` |
| Fit validity and diagnostics | `7547c35` |
| Image completion ordering | `e25d1b4` |
| Validated selected-axis CSV | `1618111` |
| Project provenance and recalculation semantics | `505f581` |
| Individual removal and undo | `b42ceff` |
| Image errors/resource policy | `314cbec` |
| Fit caching and cursor scheduling | `30adb4f` |
| Marker visibility | `06b3a6e` |
| Accessibility | `1cb967c` |
| Small-number formatting | `7a1862d` |
| Standalone documentation/theme | `ae574f2` |
| Project save/import limit consistency | `668bd62` |

The final regression/CI commit contains this ledger and the standalone test tooling; use `git log --oneline` for its ID.

## Final local verification

- `npm test`: all 10 test files passed (20 individual regression cases).
- `npm run check`: passed.
- `npm run test:browser`: passed load → blank rejection → calibrate → measure → CSV download → PNG-backed project save/open → remove/undo → corrupt image rejection → keyboard capture; checked a 390px mobile viewport and no page/HTTP errors.
- Browser run used Puppeteer 25.16.0 with the environment's installed Chrome 131 via `PUPPETEER_EXECUTABLE_PATH`. No screen reader or large-image performance benchmark was run. CI configuration is committed but has not run on GitHub; its matching downloaded browser was not exercised locally.
- `npm ci --ignore-scripts --offline --cache /tmp/reverse-chart-npm-cache`: lockfile install passed. Dependency audit reported zero known vulnerabilities. Runtime remains dependency-free; Puppeteer is development-only.
- `git diff --check`: passed.
- Changes and commits are confined to this subrepo. The parent Git index has no staged reverse-chart pointer change. No parent build, publication, push, or deployment was performed. The parent working tree will naturally display reverse-chart as modified because its checked-out commit advanced.

All reviewed findings are addressed. Remaining limitations are documented: ordinary axis-aligned charts only, explicit extrapolation interpretation, bounded session-local undo, resource limits, and manual project saving rather than automatic persistence.
