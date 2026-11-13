const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const state = {
  baselineImage: null,
  actualImage: null,
  projectionImageData: null,
};

const today = new Date();
const isoDate = (date) => date.toISOString().slice(0, 10);
const readableDate = (date) => date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const n = (selector) => Number($(selector).value) || 0;
const value = (selector) => $(selector).value;
const signed = (num, unit = "") => `${num > 0 ? "+" : ""}${Number(num).toFixed(1)}${unit}`;

$("#baseline-date").value = isoDate(today);
$("#checkin-date").value = isoDate(today);

function navigate(step) {
  $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === `step-${step}`));
  $$(".step").forEach((button) => button.classList.toggle("active", Number(button.dataset.step) === step));
  window.scrollTo({ top: 250, behavior: "smooth" });
  if (step === 2) updateProjection();
  if (step === 3) syncComparison();
}

$$(".step").forEach((button) => button.addEventListener("click", () => navigate(Number(button.dataset.step))));
$$(".next").forEach((button) => button.addEventListener("click", () => {
  if (button.dataset.next === "2" && !validateBaseline()) return;
  navigate(Number(button.dataset.next));
}));

function validateBaseline() {
  const required = ["#baseline-date", "#height", "#weight", "#waist"];
  let valid = true;
  required.forEach((selector) => {
    const input = $(selector);
    const okay = input.type === "date" ? Boolean(input.value) : Number(input.value) > 0;
    input.style.borderColor = okay ? "" : "#e05a5a";
    valid = valid && okay;
  });
  if (!valid) alert("Add the required baseline measurements to continue.");
  if (valid) initializeTargets();
  return valid;
}

function initializeTargets() {
  if (!$("#target-weight").value) $("#target-weight").value = Math.max(35, n("#weight") * 0.94).toFixed(1);
  if (!$("#target-waist").value) $("#target-waist").value = Math.max(45, n("#waist") * 0.94).toFixed(1);
  if (!$("#target-bodyfat").value && n("#bodyfat")) $("#target-bodyfat").value = Math.max(3, n("#bodyfat") - 3).toFixed(1);
}

function setImageUpload(inputSelector, previewSelector, containerSelector, key, afterLoad) {
  const input = $(inputSelector);
  const preview = $(previewSelector);
  const container = $(containerSelector);

  const loadFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 15 * 1024 * 1024) return alert("Please choose an image smaller than 15 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      preview.src = reader.result;
      container.classList.add("has-image");
      const image = new Image();
      image.onload = () => { state[key] = image; afterLoad?.(); };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  input.addEventListener("change", () => loadFile(input.files[0]));
  ["dragenter", "dragover"].forEach((event) => container.addEventListener(event, (e) => { e.preventDefault(); container.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((event) => container.addEventListener(event, (e) => { e.preventDefault(); container.classList.remove("dragging"); }));
  container.addEventListener("drop", (e) => loadFile(e.dataTransfer.files[0]));
}

setImageUpload("#baseline-photo", "#baseline-preview", "#baseline-drop", "baselineImage", updateProjection);
setImageUpload("#actual-photo", "#actual-preview", ".actual-upload", "actualImage");

function projectionDate() {
  const base = new Date(`${value("#baseline-date")}T12:00:00`);
  base.setDate(base.getDate() + n("#weeks") * 7);
  return base;
}

function updateProjection() {
  initializeTargets();
  const weeks = n("#weeks");
  const targetDate = projectionDate();
  $("#weeks-output").textContent = `${weeks} weeks`;
  $("#target-date-label").textContent = `Target date · ${readableDate(targetDate)}`;
  $("#projection-date").textContent = readableDate(targetDate);
  $("#nutrition-output").textContent = `${n("#nutrition")}%`;
  $("#adherence-output").textContent = `${n("#adherence")}%`;
  $("#target-sleep-output").textContent = `${n("#target-sleep").toFixed(1)}h`;

  const currentWeight = n("#weight");
  const currentWaist = n("#waist");
  const currentBf = n("#bodyfat");
  const targetWeight = n("#target-weight");
  const targetWaist = n("#target-waist");
  const targetBf = n("#target-bodyfat");

  $("#projected-weight-display").textContent = targetWeight ? `${targetWeight.toFixed(1)} kg` : "—";
  $("#projected-waist-display").textContent = targetWaist ? `${targetWaist.toFixed(1)} cm` : "—";
  $("#projected-bf-display").textContent = targetBf ? `${targetBf.toFixed(1)}%` : "—";
  $("#projected-weight-delta").textContent = targetWeight ? `${signed(targetWeight - currentWeight, " kg")} change` : "—";
  $("#projected-waist-delta").textContent = targetWaist ? `${signed(targetWaist - currentWaist, " cm")} change` : "—";
  $("#projected-bf-delta").textContent = targetBf && currentBf ? `${signed(targetBf - currentBf, "%")} change` : "Not measured";

  const weeklyRate = currentWeight && weeks ? Math.abs(targetWeight - currentWeight) / currentWeight / weeks * 100 : 0;
  const warning = weeklyRate > 1 || (targetWeight < currentWeight && weeklyRate > .85);
  $("#rate-card").classList.toggle("warning", warning);
  $("#rate-title").textContent = warning ? "Aggressive pace" : "Sustainable pace";
  $("#rate-copy").textContent = warning
    ? `${weeklyRate.toFixed(2)}% body-weight change per week may be difficult to sustain. Consider more time or a smaller change.`
    : `${weeklyRate.toFixed(2)}% body-weight change per week sits within a commonly manageable range.`;
  $(".rate-icon").textContent = warning ? "!" : "✓";
  renderProjection();
}

function drawCover(ctx, image, canvasWidth, canvasHeight) {
  const scale = Math.max(canvasWidth / image.width, canvasHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height };
}

function renderProjection() {
  if (!state.baselineImage) return;
  const canvas = $("#projection-canvas");
  const width = 720;
  const height = 720;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const image = state.baselineImage;
  const cover = drawCover(ctx, image, width, height);
  const waistChange = n("#waist") ? (n("#target-waist") - n("#waist")) / n("#waist") : 0;
  const bfChange = n("#bodyfat") && n("#target-bodyfat") ? n("#target-bodyfat") - n("#bodyfat") : 0;
  const strength = n("#strength-change") / 100;
  const strips = 120;
  const stripH = image.height / strips;

  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(0, 0, width, height);
  ctx.filter = `contrast(${100 + Math.max(-10, -bfChange * 1.3)}%) saturate(${100 + Math.max(-8, -bfChange * .45)}%)`;

  for (let i = 0; i < strips; i++) {
    const yNorm = (i + .5) / strips;
    const waistInfluence = Math.exp(-Math.pow((yNorm - .53) / .14, 2));
    const shoulderInfluence = Math.exp(-Math.pow((yNorm - .31) / .11, 2));
    const localScale = 1 + waistChange * waistInfluence * .8 + strength * shoulderInfluence * .12;
    const sourceY = i * stripH;
    const destinationY = cover.y + (sourceY / image.height) * cover.height;
    const destinationH = cover.height / strips + 1;
    const destinationW = cover.width * localScale;
    const destinationX = width / 2 - destinationW / 2;
    ctx.drawImage(image, 0, sourceY, image.width, stripH + 1, destinationX, destinationY, destinationW, destinationH);
  }
  ctx.filter = "none";
  canvas.style.display = "block";
  $("#empty-projection").style.display = "none";
  state.projectionImageData = canvas.toDataURL("image/jpeg", .88);
}

[
  "#weeks", "#target-weight", "#target-waist", "#target-bodyfat", "#strength-change",
  "#nutrition", "#adherence", "#target-sleep", "#weight", "#waist", "#bodyfat", "#baseline-date"
].forEach((selector) => $(selector).addEventListener("input", updateProjection));

function syncComparison() {
  updateProjection();
  const date = projectionDate();
  $("#compare-projected-date").textContent = readableDate(date);
  $("#compare-target-weight").textContent = n("#target-weight") ? `${n("#target-weight").toFixed(1)} kg` : "—";
  $("#compare-target-waist").textContent = n("#target-waist") ? `${n("#target-waist").toFixed(1)} cm` : "—";
  $("#compare-target-bf").textContent = n("#target-bodyfat") ? `${n("#target-bodyfat").toFixed(1)}%` : "—";
  if (state.projectionImageData) {
    const image = new Image();
    image.onload = () => {
      const canvas = $("#compare-canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d").drawImage(image, 0, 0);
    };
    image.src = state.projectionImageData;
  }
}

function calculateVerdict() {
  const targetDate = projectionDate();
  const checkin = new Date(`${value("#checkin-date")}T12:00:00`);
  const baseline = new Date(`${value("#baseline-date")}T12:00:00`);
  const fullDuration = Math.max(1, targetDate - baseline);
  const progress = Math.max(0, Math.min(1, (checkin - baseline) / fullDuration));

  const metrics = [
    { name: "Weight", baseline: n("#weight"), target: n("#target-weight"), actual: n("#actual-weight"), unit: "kg" },
    { name: "Waist", baseline: n("#waist"), target: n("#target-waist"), actual: n("#actual-waist"), unit: "cm" },
    { name: "Body fat", baseline: n("#bodyfat"), target: n("#target-bodyfat"), actual: n("#actual-bf"), unit: "%" },
  ].filter((metric) => metric.baseline && metric.target && metric.actual);

  if (!metrics.length) return alert("Add at least one actual measurement to calculate a verdict.");
  const assessed = metrics.map((metric) => {
    const dueToday = metric.baseline + (metric.target - metric.baseline) * progress;
    const totalChange = Math.abs(metric.target - metric.baseline) || 1;
    const miss = Math.abs(metric.actual - dueToday);
    const score = Math.max(0, 100 - (miss / totalChange) * 100);
    return { ...metric, dueToday, delta: metric.actual - dueToday, score };
  });
  const score = Math.round(assessed.reduce((sum, item) => sum + item.score, 0) / assessed.length);
  let title = "Plan needs an adjustment";
  let copy = "The measurements are outside the projected path. Review adherence, recovery, or the target itself.";
  if (score >= 90) { title = "Right on the line"; copy = "Your measurements closely match the projection for this point in time."; }
  else if (score >= 75) { title = "On track"; copy = "You are close to the projected path. Keep the process consistent and reassess at the next check-in."; }
  else if (score >= 55) { title = "Within striking distance"; copy = "There is a visible gap, but the direction is still workable. Focus on the behaviour with the lowest consistency."; }

  $("#verdict-score").textContent = score;
  $("#verdict-title").textContent = title;
  $("#verdict-text").textContent = copy;
  $("#verdict-deltas").innerHTML = assessed.map((item) => `<span class="delta-pill">${item.name}<b>${signed(item.delta, item.unit)}</b></span>`).join("");
  $("#verdict-card").scrollIntoView({ behavior: "smooth", block: "center" });
}

$("#calculate-verdict").addEventListener("click", calculateVerdict);
$("#reset-app").addEventListener("click", () => {
  if (!confirm("Clear this session and start a new baseline?")) return;
  location.reload();
});

updateProjection();
