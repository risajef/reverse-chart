# Reverse Chart fix progress

Scope: findings in the 6 November 2026 review. Each fix is committed separately in this repository. Parent website sources, staged assets, and the parent submodule pointer are outside this work. No deployment or push is included.

| Finding | Status | Verification |
| --- | --- | --- |
| 1. Blank calibration becomes zero | Done | Native input validity and `valueAsNumber`; regression covers blank, malformed, explicit zero, and log zero rejection. |
| 2. Unusable fits reported as calibrated | Done | Pure centered regression, explicit fit/evaluation states, finite/range validation, residual diagnostics; linear/reversed/log/degenerate/extreme tests pass. |
| 3. Stale image completion overwrites session | Done | Load generations guard commits; candidate URLs release exactly once; controlled B→A completion and failed replacement tests pass. Basic decode-error handling added here; resource policy follows in fix 7. |
| 4. Invalid/incomplete CSV output | Done | Explicit X/Y/both selection; export rejects missing fits and invalid evaluated values; list identifies uncalibrated points. CSV regression cases pass. |
| 5. Recalibration semantics and provenance | Done | Current-calibration semantics and revision visible; versioned project save/open embeds PNG, dimensions, scales and points; strict validation and round-trip CSV tests pass. |
| 6. Point recovery and undo | Pending | |
| 7. Image errors and resource limits | Pending | |
| 8. Repeated fits and rendering work | Pending | |
| Measurement marker visibility | Pending | |
| Accessibility | Pending | |
| Small-number display precision | Pending | |
| Standalone documentation/theme | Pending | |
| Regression checks and browser smoke | In progress | Dependency-free Node test harness added with fix 1. |

Run checks with `node --test tests/*.test.cjs` and `node --check app.js`.
