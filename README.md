# Reverse Chart

A static browser tool for extracting values from chart images. Images and calculations stay in the browser; there is no server API or runtime JavaScript dependency.

## Run locally

```sh
git clone https://github.com/risajef/reverse-chart.git
cd reverse-chart
python3 -m http.server 8000
```

Open <http://127.0.0.1:8000/>. Only `index.html`, `app.js`, `styles.css`, and the example PNGs are needed for hosting. No parent-site theme or build step is required.

## Extract values

1. Upload or drop an image, load the example, or focus the chart and paste an image.
2. Choose linear or logarithmic scales for each axis.
3. In Calibrate mode, choose X or Y, enter a tick value, and click its position. Each axis needs at least two distinct pixel positions and distinct values. Log values must be positive.
4. Add more tick points if helpful. The tool fits a least-squares line in linear or log10 space. Status shows the maximum residual in that space; a large residual suggests inconsistent tick selections. Rotated, skewed, or perspective-distorted axes are not supported.
5. In Measure mode, click to capture pixel points. CSV export requires valid results for the selected axes; choose X only or Y only for one-axis extraction.

Captured points use the **current calibration**. Adding/removing calibration points or changing scales recalculates all captured values. The displayed calibration revision makes these changes visible. CSV contains the selected derived values and source pixel coordinates. It does not freeze or embed the calibration.

Save a project to retain the image, image dimensions/name, scales, calibration, revision, and captured points together. Open a project to reproduce its values. Project files are versioned JSON with an embedded PNG; unsupported schemas, external image URLs, invalid coordinates, and duplicate IDs are rejected.

A point's Remove button deletes just that point. Undo restores point additions/removals, clears, scale changes, and image/project replacements. Undo retains up to 30 changes and three distinct prior decoded images; it is session-local and does not survive a reload. Save a project before closing the tab. There is no automatic persistence or redo.

Focus the chart and use arrows to move one source pixel, Shift + arrow for 10 pixels, or Alt + arrow for 0.1 pixel. Enter or Space captures a point in the selected mode. These are source-image steps, independent of display scaling.

## Limits and interpretation

- Image files: at most 32 MiB, 8192 pixels per side, and 16,777,216 total pixels. Oversized images are rejected rather than silently downsampled. The browser still needs to decode the selected file before its dimensions are known.
- Project files: at most 64 MiB; at most 10,000 calibration points and 10,000 measurement points on import.
- Image loads commit only after decode, dimension validation, and a canvas backing-store check. A failed load keeps the current chart. Late completions from obsolete requests cannot replace the current session.
- Numeric overflow/underflow and degenerate fits are reported. CSV refuses invalid selected-axis values rather than inserting empty cells. Values outside the calibrated tick interval are extrapolated; check that this makes sense for your chart.
- Display/export precision is not measurement accuracy. Tick placement, pixel resolution, source-image quality, and calibration consistency determine accuracy.
- Keyboard and text-list support are provided; the canvas image itself is not converted into a semantic chart for screen readers.

## Code organization

The app intentionally keeps a single runtime script so static embedding remains simple. Inside `app.js`, the calculation functions `fitCalibration()` and `evaluateFit()` accept explicit inputs and have no DOM/session dependency. Session operations manage points and undo; the image adapter owns load generations and resource checks; project validation/serialization preserves source state; the view renders those results. Fits are derived once per calibration revision and shared by the readout, lists, and CSV. Cursor rendering is scheduled per animation frame.

Do not mutate calibration values without invalidating the calibration revision. The UI's add/remove/clear/scale/restore operations do this; measurement additions do not invalidate fits.

## Checks

The numerical, export, project, image lifecycle, undo, and rendering regression tests need only Node.js:

```sh
node --test tests/*.test.cjs
node --check app.js
```

The test harness evaluates the actual application with minimal browser stubs; it does not replace real browser verification. See `FIX_PROGRESS.md` for the review findings and their implementation status.
