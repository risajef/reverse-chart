const imageInput = document.querySelector("#imageInput");
const loadExample = document.querySelector("#loadExample");
const calibrateMode = document.querySelector("#calibrateMode");
const measureMode = document.querySelector("#measureMode");
const calibrationControls = document.querySelector("#calibrationControls");
const measureControls = document.querySelector("#measureControls");
const axisInput = document.querySelector("#axisInput");
const xScaleInput = document.querySelector("#xScaleInput");
const yScaleInput = document.querySelector("#yScaleInput");
const valueInput = document.querySelector("#valueInput");
const readout = document.querySelector("#readout");
const fitStatus = document.querySelector("#fitStatus");
const calibrationList = document.querySelector("#calibrationList");
const measurementList = document.querySelector("#measurementList");
const measureCount = document.querySelector("#measureCount");
const clearCalibration = document.querySelector("#clearCalibration");
const clearMeasurements = document.querySelector("#clearMeasurements");
const exportAxes = document.querySelector("#exportAxes");
const exportMeasurements = document.querySelector("#exportMeasurements");
const emptyState = document.querySelector("#emptyState");
const chartFrame = document.querySelector("#chartFrame");
const canvas = document.querySelector("#chartCanvas");
let fakeCursor = document.querySelector("#fakeCursor");
const ctx = canvas.getContext("2d");

if (!fakeCursor) {
  fakeCursor = document.createElement("div");
  fakeCursor.id = "fakeCursor";
  fakeCursor.className = "fake-cursor hidden";
  fakeCursor.setAttribute("aria-hidden", "true");
  chartFrame.insertBefore(fakeCursor, emptyState);
}
const magnifier = {
  radiusCss: 74,
  zoom: 3,
};

const state = {
  calibrationRevision: 0,
  mode: "calibrate",
  image: null,
  imageName: "",
  scales: {
    x: "linear",
    y: "linear",
  },
  calibration: [],
  measurements: [],
  hover: null,
};

const undoHistory = [];

function checkpoint() {
  undoHistory.push({
    image: state.image, imageName: state.imageName, scales: { ...state.scales },
    calibration: state.calibration.map(point => ({ ...point })),
    measurements: state.measurements.map(point => ({ ...point })),
  });
  // Snapshots share decoded images, but retain at most three distinct images.
  while (undoHistory.length > 30 || new Set(undoHistory.map(entry => entry.image).filter(Boolean)).size > 3) {
    undoHistory.shift();
  }
  document.querySelector("#undo").disabled = false;
}

function refreshSession() {
  xScaleInput.value = state.scales.x;
  yScaleInput.value = state.scales.y;
  emptyState.style.display = state.image ? "none" : "";
  imageStatus.textContent = state.image ? `${state.imageName}: ${state.image.width} × ${state.image.height} pixels.` : "No chart loaded.";
  sizeCanvas();
  updateLists();
  updateFitStatus();
  updateReadout(state.hover);
  updateFakeCursor(state.hover);
  draw();
}

function undo() {
  if (!undoHistory.length) return;
  imageLoadGeneration++;
  projectReadGeneration++;
  if (cancelPendingImage) cancelPendingImage();
  cancelPendingImage = null;
  Object.assign(state, undoHistory.pop());
  state.calibrationRevision++;
  state.hover = null;
  refreshSession();
  document.querySelector("#undo").disabled = !undoHistory.length;
}

function removePoint(collection, id) {
  if (!state[collection].some(point => point.id === id)) return;
  checkpoint();
  state[collection] = state[collection].filter(point => point.id !== id);
  if (collection === "calibration") state.calibrationRevision++;
  refreshSession();
}

function appendRemoveButton(item, collection, point, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove-point";
  button.textContent = "Remove";
  button.setAttribute("aria-label", `Remove ${collection} point ${index + 1}`);
  button.addEventListener("click", () => removePoint(collection, point.id));
  item.append(button);
}

function setMode(mode) {
  state.mode = mode;
  calibrateMode.classList.toggle("active", mode === "calibrate");
  measureMode.classList.toggle("active", mode === "measure");
  calibrationControls.classList.toggle("hidden", mode !== "calibrate");
  measureControls.classList.toggle("hidden", mode !== "measure");
  updateReadout(state.hover);
  draw();
}

const imageStatus = document.querySelector("#imageStatus");
const MAX_IMAGE_PIXELS = 16 * 1024 * 1024;
const MAX_IMAGE_SIDE = 8192;
const MAX_IMAGE_BYTES = 32 * 1024 * 1024;

function validImageDimensions(width, height) {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) && width > 0 && height > 0 &&
    width <= MAX_IMAGE_SIDE && height <= MAX_IMAGE_SIDE && width * height <= MAX_IMAGE_PIXELS;
}

function checkImageResources(image) {
  if (!validImageDimensions(image.width, image.height)) {
    throw new Error("Image exceeds 8192 pixels per side or 16 megapixels. Resize it before loading.");
  }
  // Verify the backing store before replacing the active document.
  const probe = document.createElement("canvas");
  probe.width = image.width;
  probe.height = image.height;
  try {
    const probeContext = probe.getContext("2d");
    if (!probeContext) throw new Error("Canvas is unavailable.");
    probeContext.drawImage(image, 0, 0);
    probeContext.getImageData(image.width - 1, image.height - 1, 1, 1);
  } finally {
    probe.width = 0;
    probe.height = 0;
  }
}

let imageLoadGeneration = 0;
let cancelPendingImage = null;

function loadImage(src, name, ownedUrl = false, project = null) {
  const generation = ++imageLoadGeneration;
  if (cancelPendingImage) cancelPendingImage();
  imageStatus.textContent = `Loading ${name}…` ;
  const image = new Image();
  let released = false;
  const release = () => {
    if (ownedUrl && !released) URL.revokeObjectURL(src);
    released = true;
  };
  cancelPendingImage = release;
  image.onerror = () => {
    release();
    if (generation !== imageLoadGeneration) return;
    cancelPendingImage = null;
    imageStatus.textContent = "Could not decode this image. The current chart is unchanged.";
    readout.textContent = "Could not load this image. The current chart is unchanged.";
  };
  image.onload = () => {
    release();
    if (generation !== imageLoadGeneration) return;
    cancelPendingImage = null;
    try {
      checkImageResources(image);
    } catch (error) {
      imageStatus.textContent = `Image not loaded: ${error.message}`;
      return;
    }
    if (project && (image.width !== project.image.width || image.height !== project.image.height)) {
      imageStatus.textContent = "Project image dimensions do not match its metadata.";
      return;
    }
    checkpoint();
    imageStatus.textContent = `${name}: ${image.width} × ${image.height} pixels.`;
    state.image = image;
    state.imageName = name;
    state.calibration = project ? project.calibration : [];
    state.measurements = project ? project.measurements : [];
    if (project) {
      state.scales = { ...project.scales };
      state.calibrationRevision = project.calibrationRevision;
    } else state.calibrationRevision++;
    xScaleInput.value = state.scales.x;
    yScaleInput.value = state.scales.y;
    state.hover = null;
    sizeCanvas();
    emptyState.style.display = "none";
    updateLists();
    updateFitStatus();
    updateReadout(null);
    updateFakeCursor(null);
    draw();
  };
  try { image.src = src; } catch { image.onerror(); }
}

function loadImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    readout.textContent = "Drop an image file to load a chart.";
    return;
  }

  if (file.size > MAX_IMAGE_BYTES) {
    imageStatus.textContent = "Image exceeds the 32 MiB file limit. Resize it before loading.";
    return;
  }
  loadImage(URL.createObjectURL(file), file.name || "Pasted image", true);
}

function getClipboardImage(clipboardData) {
  const items = Array.from(clipboardData?.items || []);
  const imageItem = items.find((item) => item.kind === "file" && item.type.startsWith("image/"));
  if (imageItem) return imageItem.getAsFile();

  return Array.from(clipboardData?.files || []).find((file) => file.type.startsWith("image/")) || null;
}

function sizeCanvas() {
  if (!state.image) return;
  const frame = document.querySelector("#chartFrame");
  const availableWidth = Math.max(320, frame.clientWidth - 32);
  const availableHeight = Math.max(280, window.innerHeight - 80);
  const scale = Math.min(availableWidth / state.image.width, availableHeight / state.image.height, 1);

  canvas.width = state.image.width;
  canvas.height = state.image.height;
  canvas.style.width = `${Math.round(state.image.width * scale)}px`;
  canvas.style.height = `${Math.round(state.image.height * scale)}px`;
}

function getPointerPoint(event) {
  if (!state.image) return null;
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);
  if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return null;
  return { x, y };
}

function clampPoint(point) {
  return {
    x: Math.min(Math.max(point.x, 0), canvas.width),
    y: Math.min(Math.max(point.y, 0), canvas.height),
  };
}

function getCenteredPoint() {
  return {
    x: canvas.width / 2,
    y: canvas.height / 2,
  };
}

function createPointId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function updateFakeCursor(point) {
  if (!point || !state.image) {
    fakeCursor.classList.add("hidden");
    return;
  }

  const canvasRect = canvas.getBoundingClientRect();
  const frameRect = chartFrame.getBoundingClientRect();
  const cssX = canvasRect.left - frameRect.left + point.x * (canvasRect.width / canvas.width);
  const cssY = canvasRect.top - frameRect.top + point.y * (canvasRect.height / canvas.height);
  fakeCursor.style.left = `${cssX}px`;
  fakeCursor.style.top = `${cssY}px`;
  fakeCursor.classList.remove("hidden");
}

function setCursorPoint(point) {
  state.hover = point ? clampPoint(point) : null;
  updateReadout(state.hover);
  updateFakeCursor(state.hover);
  draw();
}

function commitCursorPoint() {
  if (!state.hover) return;
  if (state.mode === "calibrate") addCalibration(state.hover);
  if (state.mode === "measure") addMeasurement(state.hover);
}

function addCalibration(point) {
  const value = valueInput.valueAsNumber;
  if (!valueInput.value.trim() || !valueInput.validity.valid || !Number.isFinite(value)) {
    readout.textContent = "Enter a numeric calibration value before clicking the chart.";
    valueInput.focus();
    return;
  }

  const axis = axisInput.value;
  if (state.scales[axis] === "log" && value <= 0) {
    readout.textContent = "Logarithmic calibration values must be greater than zero.";
    valueInput.focus();
    return;
  }

  checkpoint();
  state.calibrationRevision++;
  state.calibration.push({
    id: createPointId(),
    axis,
    value,
    x: point.x,
    y: point.y,
  });
  updateLists();
  updateFitStatus();
  updateReadout(point);
  draw();
}

function addMeasurement(point) {
  checkpoint();
  state.measurements.push({
    id: createPointId(),
    x: point.x,
    y: point.y,
  });
  updateLists();
  draw();
}

// Pure numerical core: independent of the DOM and session state.
function fitCalibration(calibration, axis, scale) {
  const pixelKey = axis === "x" ? "x" : "y";
  const selected = calibration.filter(point => point.axis === axis);
  const points = selected.filter(point => Number.isFinite(point.value) &&
    Number.isFinite(point[pixelKey]) && (scale !== "log" || point.value > 0));
  const invalidCount = selected.length - points.length;
  const failure = status => ({ status, count: points.length, invalidCount });
  if (points.length < 2) return failure("insufficient-points");
  const pixels = points.map(point => point[pixelKey]);
  const values = points.map(point => scale === "log" ? Math.log10(point.value) : point.value);
  const pixelOrigin = pixels[0];
  const valueOrigin = values[0];
  const meanPixel = pixels.reduce((sum, pixel) => sum + (pixel - pixelOrigin) / points.length, 0);
  const meanValue = values.reduce((sum, value) => sum + (value - valueOrigin) / points.length, 0);
  let variance = 0;
  let covariance = 0;
  for (let i = 0; i < points.length; i++) {
    const dx = pixels[i] - pixelOrigin - meanPixel;
    variance += dx * dx;
    covariance += dx * (values[i] - valueOrigin - meanValue);
  }
  if (variance < 1e-12) return failure("insufficient-pixel-span");
  if (Math.max(...values) === Math.min(...values)) return failure("degenerate-value-range");
  const slope = covariance / variance;
  const centerPixel = pixelOrigin + meanPixel;
  const centerValue = valueOrigin + meanValue;
  const intercept = centerValue - slope * centerPixel;
  const residuals = values.map((value, i) => value - (centerValue + slope * (pixels[i] - centerPixel)));
  const maxResidual = Math.max(...residuals.map(Math.abs));
  if (![slope, intercept, centerPixel, centerValue, maxResidual].every(Number.isFinite) || slope === 0) {
    return failure("nonfinite-fit");
  }
  return { status: "ready", slope, intercept, centerPixel, centerValue,
    count: points.length, invalidCount, maxResidual, scale };
}

function evaluateFit(fit, pixel) {
  if (fit.status !== "ready") return { status: fit.status, value: null };
  const transformed = fit.centerValue + fit.slope * (pixel - fit.centerPixel);
  const value = fit.scale === "log" ? 10 ** transformed : transformed;
  if (!Number.isFinite(value) || (fit.scale === "log" && value <= 0)) {
    return { status: "out-of-range", value: null };
  }
  return { status: "ready", value };
}

function fitAxis(axis) {
  return fitCalibration(state.calibration, axis, state.scales[axis]);
}

function computeResults(point) {
  return { x: evaluateFit(fitAxis("x"), point.x), y: evaluateFit(fitAxis("y"), point.y) };
}

function computeValues(point) {
  const result = computeResults(point);
  return { x: result.x.value, y: result.y.value };
}

function fitMessage(axis, fit) {
  const reasons = {
    "insufficient-points": `needs ${Math.max(0, 2 - fit.count)} more valid points`,
    "insufficient-pixel-span": "needs points at distinct pixel positions",
    "degenerate-value-range": "needs distinct calibration values",
    "nonfinite-fit": "has values outside the supported numeric range",
  };
  const message = fit.status === "ready"
    ? `calibrated from ${fit.count} points; max residual ${formatValue(fit.maxResidual)}${fit.scale === "log" ? " log10 units" : " axis units"}`
    : reasons[fit.status];
  return `${axis.toUpperCase()} ${formatScale(axis)} ${message}${fit.invalidCount ? `; ${fit.invalidCount} invalid points ignored` : ""}`;
}

function resultText(result, axis) {
  if (result.status === "ready") return formatValue(result.value, axis);
  if (result.status === "out-of-range") return "outside numeric range";
  return "axis calibration required";
}

function formatPlainNumber(value, maximumFractionDigits = 12) {
  return new Intl.NumberFormat(undefined, {
    useGrouping: false,
    maximumFractionDigits,
  }).format(value);
}

function formatValue(value, axis = null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "not calibrated";
  if (axis && state.scales[axis] === "linear") return formatPlainNumber(value);
  const abs = Math.abs(value);
  if (abs >= 1000 || (abs > 0 && abs < 0.01)) return value.toExponential(3);
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(value);
}

function formatPreciseValue(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return value.toString();
  return Number(value.toPrecision(15)).toString();
}

function formatScale(axis) {
  return state.scales[axis] === "log" ? "log" : "linear";
}

function updateReadout(point) {
  if (!state.image) {
    readout.textContent = "Upload or load a chart to begin.";
    return;
  }

  if (!point) {
    readout.textContent = state.mode === "calibrate"
      ? "Calibration mode: enter a value, choose X or Y, then click the chart."
      : "Measure mode: hover over the chart to read values.";
    return;
  }

  const results = computeResults(point);
  readout.innerHTML = `
    <strong>Pixel</strong> ${Math.round(point.x)}, ${Math.round(point.y)}<br>
    <strong>X</strong> ${resultText(results.x, "x")} (${formatScale("x")})<br>
    <strong>Y</strong> ${resultText(results.y, "y")} (${formatScale("y")})
  `;
}

function updateFitStatus() {
  fitStatus.textContent = ["x", "y"].map(axis => fitMessage(axis, fitAxis(axis))).join(". ") +
    `. Calibration revision ${state.calibrationRevision}. All captured points use the current calibration.`;
}

function updateLists() {
  calibrationList.innerHTML = "";
  state.calibration.forEach((point, index) => {
    const item = document.createElement("li");
    const isInvalidLogPoint = state.scales[point.axis] === "log" && point.value <= 0;
    const suffix = isInvalidLogPoint ? " (ignored for log scale)" : "";
    item.textContent = `${point.axis.toUpperCase()} = ${formatValue(point.value, point.axis)} at pixel ${Math.round(point.x)}, ${Math.round(point.y)}${suffix}`;
    appendRemoveButton(item, "calibration", point, index);
    calibrationList.append(item);
  });

  measurementList.innerHTML = "";
  state.measurements.forEach((point, index) => {
    const results = computeResults(point);
    const item = document.createElement("li");
    const display = axis => results[axis].status === "ready" ? formatPreciseValue(results[axis].value) : resultText(results[axis], axis);
    item.textContent = `${index + 1}. X ${display("x")}, Y ${display("y")} at pixel ${formatPreciseValue(point.x)}, ${formatPreciseValue(point.y)}`;
    appendRemoveButton(item, "measurements", point, index);
    measurementList.append(item);
  });
  measureCount.textContent = state.measurements.length;
}

function createMeasurementsCsv(axes = ["x", "y"]) {
  if (!axes.length || new Set(axes).size !== axes.length || axes.some(axis => !["x", "y"].includes(axis))) {
    throw new Error("Choose X, Y, or both axes for export.");
  }
  const fits = Object.fromEntries(axes.map(axis => [axis, fitAxis(axis)]));
  for (const axis of axes) {
    if (fits[axis].status !== "ready") throw new Error(fitMessage(axis, fits[axis]));
  }
  const rows = [["nr", ...axes.map(axis => `${axis} measured`), "x pixel", "y pixel"]];
  state.measurements.forEach((point, index) => {
    const values = axes.map(axis => {
      const result = evaluateFit(fits[axis], point[axis]);
      if (result.status !== "ready") {
        throw new Error(`Point ${index + 1}: ${axis.toUpperCase()} is outside the numeric range.`);
      }
      return formatPreciseValue(result.value);
    });
    rows.push([index + 1, ...values, formatPreciseValue(point.x), formatPreciseValue(point.y)]);
  });
  return rows.map(row => row.join(",")).join("\n");
}

function exportMeasuredCsv() {
  if (!state.measurements.length) {
    readout.textContent = "No measured points to export yet.";
    return;
  }

  let csv;
  try {
    const choice = exportAxes.value;
    csv = createMeasurementsCsv(choice === "x" || choice === "y" ? [choice] : ["x", "y"]);
  } catch (error) {
    readout.textContent = `CSV not exported: ${error.message}`;
    return;
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "measured-values.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// Project files preserve source pixels and calibration, not frozen derived values.
function createProject(imageData) {
  if (!state.image) throw new Error("Load a chart before saving a project.");
  if (!imageData) {
    const buffer = document.createElement("canvas");
    buffer.width = state.image.width;
    buffer.height = state.image.height;
    buffer.getContext("2d").drawImage(state.image, 0, 0);
    imageData = buffer.toDataURL("image/png");
  }
  return {
    schemaVersion: 1,
    image: { name: state.imageName, width: state.image.width, height: state.image.height, data: imageData },
    scales: { ...state.scales },
    calibrationRevision: state.calibrationRevision,
    calibration: state.calibration.map(point => ({ ...point })),
    measurements: state.measurements.map(point => ({ ...point })),
  };
}

function validateProject(project) {
  const fail = () => { throw new Error("Invalid or unsupported Reverse Chart project."); };
  if (!project || project.schemaVersion !== 1 || !project.image || !project.scales) fail();
  const image = project.image;
  if (typeof image.name !== "string" || image.name.length > 4096 ||
      !Number.isSafeInteger(image.width) || image.width < 1 ||
      !Number.isSafeInteger(image.height) || image.height < 1 ||
      !validImageDimensions(image.width, image.height) ||
      typeof image.data !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image.data)) fail();
  if (![project.scales.x, project.scales.y].every(scale => ["linear", "log"].includes(scale)) ||
      !Number.isSafeInteger(project.calibrationRevision) || project.calibrationRevision < 0) fail();
  const ids = new Set();
  const checkPoints = (points, calibration) => {
    if (!Array.isArray(points) || points.length > 10000) fail();
    return points.map(point => {
      if (!point || typeof point.id !== "string" || !point.id || point.id.length > 200 || ids.has(point.id) ||
          !Number.isFinite(point.x) || point.x < 0 || point.x > image.width ||
          !Number.isFinite(point.y) || point.y < 0 || point.y > image.height) fail();
      ids.add(point.id);
      if (calibration && (!["x", "y"].includes(point.axis) || !Number.isFinite(point.value))) fail();
      return calibration ? { id: point.id, x: point.x, y: point.y, axis: point.axis, value: point.value }
        : { id: point.id, x: point.x, y: point.y };
    });
  };
  return {
    schemaVersion: 1, image: { name: image.name, width: image.width, height: image.height, data: image.data },
    scales: { x: project.scales.x, y: project.scales.y }, calibrationRevision: project.calibrationRevision,
    calibration: checkPoints(project.calibration, true), measurements: checkPoints(project.measurements, false),
  };
}

function downloadFile(contents, type, filename) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

document.querySelector("#saveProject").addEventListener("click", () => {
  try {
    downloadFile(JSON.stringify(createProject(), null, 2), "application/json", "reverse-chart-project.json");
  } catch (error) { readout.textContent = error.message; }
});

let projectReadGeneration = 0;
document.querySelector("#openProject").addEventListener("change", async event => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  const generation = ++projectReadGeneration;
  const imageGeneration = imageLoadGeneration;
  try {
    if (file.size > 64 * 1024 * 1024) throw new Error("Project exceeds the 64 MiB file limit.");
    const project = validateProject(JSON.parse(await file.text()));
    if (generation !== projectReadGeneration || imageGeneration !== imageLoadGeneration) return;
    loadImage(project.image.data, project.image.name, false, project);
  } catch (error) {
    if (generation === projectReadGeneration && imageGeneration === imageLoadGeneration) {
      readout.textContent = `Project not opened: ${error.message}`;
    }
  }
});

function drawMarker(point, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(point.x - 8, point.y);
  ctx.lineTo(point.x + 8, point.y);
  ctx.moveTo(point.x, point.y - 8);
  ctx.lineTo(point.x, point.y + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
  ctx.fill();

  if (label) {
    ctx.font = "12px system-ui, sans-serif";
    const width = ctx.measureText(label).width + 10;
    const x = Math.min(point.x + 10, canvas.width - width - 4);
    const y = Math.max(18, point.y - 10);
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.fillRect(x, y - 15, width, 20);
    ctx.strokeStyle = color;
    ctx.strokeRect(x, y - 15, width, 20);
    ctx.fillStyle = color;
    ctx.fillText(label, x + 5, y);
  }
  ctx.restore();
}

function drawHover(point) {
  if (!point) return;
  ctx.save();
  ctx.strokeStyle = "rgba(15, 118, 110, 0.72)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(point.x, 0);
  ctx.lineTo(point.x, canvas.height);
  ctx.moveTo(0, point.y);
  ctx.lineTo(canvas.width, point.y);
  ctx.stroke();
  ctx.restore();
}

function drawMagnifier(point) {
  if (!point || !state.image) return;

  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  const canvasPerCssPixel = (canvas.width / rect.width + canvas.height / rect.height) / 2;
  const radius = magnifier.radiusCss * canvasPerCssPixel;
  const sourceRadius = radius / magnifier.zoom;
  const sourceLeft = point.x - sourceRadius;
  const sourceTop = point.y - sourceRadius;
  const clippedLeft = Math.max(0, sourceLeft);
  const clippedTop = Math.max(0, sourceTop);
  const clippedRight = Math.min(canvas.width, point.x + sourceRadius);
  const clippedBottom = Math.min(canvas.height, point.y + sourceRadius);
  const sourceWidth = clippedRight - clippedLeft;
  const sourceHeight = clippedBottom - clippedTop;

  if (sourceWidth <= 0 || sourceHeight <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "white";
  ctx.fillRect(point.x - radius, point.y - radius, radius * 2, radius * 2);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    state.image,
    clippedLeft,
    clippedTop,
    sourceWidth,
    sourceHeight,
    point.x - radius + (clippedLeft - sourceLeft) * magnifier.zoom,
    point.y - radius + (clippedTop - sourceTop) * magnifier.zoom,
    sourceWidth * magnifier.zoom,
    sourceHeight * magnifier.zoom,
  );
  ctx.restore();

  const lineWidth = 2 * canvasPerCssPixel;
  const reticleOuter = 18 * canvasPerCssPixel;
  const reticleGap = 4 * canvasPerCssPixel;
  const reticleDot = 2.6 * canvasPerCssPixel;

  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.28)";
  ctx.shadowBlur = 10 * canvasPerCssPixel;
  ctx.shadowOffsetY = 3 * canvasPerCssPixel;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 5 * canvasPerCssPixel;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = getCssVar("--accent");
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(15, 23, 42, 0.86)";
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(point.x - reticleOuter, point.y);
  ctx.lineTo(point.x - reticleGap, point.y);
  ctx.moveTo(point.x + reticleGap, point.y);
  ctx.lineTo(point.x + reticleOuter, point.y);
  ctx.moveTo(point.x, point.y - reticleOuter);
  ctx.lineTo(point.x, point.y - reticleGap);
  ctx.moveTo(point.x, point.y + reticleGap);
  ctx.lineTo(point.x, point.y + reticleOuter);
  ctx.stroke();

  ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
  ctx.beginPath();
  ctx.arc(point.x, point.y, reticleDot, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state.image) return;

  ctx.drawImage(state.image, 0, 0);
  state.calibration.forEach((point) => {
    const color = point.axis === "x" ? getCssVar("--x") : getCssVar("--y");
    drawMarker(point, color, `${point.axis.toUpperCase()} ${formatValue(point.value, point.axis)}`);
  });
  if (!state.hover) {
    state.measurements.forEach((point, index) => {
      drawMarker(point, getCssVar("--measure"), `${index + 1}`);
    });
  }
  drawHover(state.hover);
  drawMagnifier(state.hover);
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

imageInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  event.target.value = "";
  if (file) loadImageFile(file);
});

chartFrame.addEventListener("paste", (event) => {
  const target = event.target;
  if (target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName)) return;
  const file = getClipboardImage(event.clipboardData);
  if (!file) return;
  event.preventDefault();
  loadImageFile(file);
});

loadExample.addEventListener("click", () => {
  loadImage("log_example.png", "Example chart");
});

["dragenter", "dragover"].forEach((eventName) => {
  chartFrame.addEventListener(eventName, (event) => {
    event.preventDefault();
    chartFrame.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  chartFrame.addEventListener(eventName, () => {
    chartFrame.classList.remove("drag-over");
  });
});

chartFrame.addEventListener("drop", (event) => {
  event.preventDefault();
  const [file] = event.dataTransfer.files;
  loadImageFile(file);
});

calibrateMode.addEventListener("click", () => setMode("calibrate"));
measureMode.addEventListener("click", () => setMode("measure"));

xScaleInput.addEventListener("change", () => {
  checkpoint();
  state.calibrationRevision++;
  state.scales.x = xScaleInput.value;
  updateLists();
  updateFitStatus();
  updateReadout(state.hover);
  draw();
});

yScaleInput.addEventListener("change", () => {
  checkpoint();
  state.calibrationRevision++;
  state.scales.y = yScaleInput.value;
  updateLists();
  updateFitStatus();
  updateReadout(state.hover);
  draw();
});

canvas.addEventListener("click", (event) => {
  const point = getPointerPoint(event);
  if (!point) return;
  setCursorPoint(point);
  commitCursorPoint();
});

canvas.addEventListener("mousemove", (event) => {
  setCursorPoint(getPointerPoint(event));
});

canvas.addEventListener("mouseleave", () => {
  if (document.activeElement === canvas) return;
  setCursorPoint(null);
});

canvas.addEventListener("focus", () => {
  if (state.image && !state.hover) setCursorPoint(getCenteredPoint());
});

canvas.addEventListener("blur", () => {
  setCursorPoint(null);
});

canvas.addEventListener("keydown", (event) => {
  if (!state.image) return;

  const movement = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const vector = movement[event.key];

  if (vector) {
    event.preventDefault();
    const step = event.altKey ? 0.1 : event.shiftKey ? 10 : 1;
    const current = state.hover || getCenteredPoint();
    setCursorPoint({
      x: current.x + vector[0] * step,
      y: current.y + vector[1] * step,
    });
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    if (!state.hover) setCursorPoint(getCenteredPoint());
    commitCursorPoint();
  }
});

clearCalibration.addEventListener("click", () => {
  if (!state.calibration.length) return;
  checkpoint();
  state.calibrationRevision++;
  state.calibration = [];
  updateLists();
  updateFitStatus();
  updateReadout(state.hover);
  draw();
});

clearMeasurements.addEventListener("click", () => {
  if (!state.measurements.length) return;
  checkpoint();
  state.measurements = [];
  updateLists();
  draw();
});

document.querySelector("#undo").addEventListener("click", undo);
exportMeasurements.addEventListener("click", exportMeasuredCsv);

window.addEventListener("resize", () => {
  sizeCanvas();
  updateFakeCursor(state.hover);
  draw();
});

updateFitStatus();
