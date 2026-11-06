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
| Standalone documentation/theme | Pending | |
| Regression checks and browser smoke | In progress | Dependency-free Node test harness added with fix 1. |

Run checks with `node --test tests/*.test.cjs` and `node --check app.js`.
