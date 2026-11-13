// FORM — conditioning projection and check-in.
// Everything (photos included) is kept only in this browser's localStorage.
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const STORE_KEY = "form.v2";
const HEIC_LIB = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
const MAX_SIDE = 1100;           // photos are downscaled to this before saving
const OUT = 720;                 // render width; height follows the start photo's shape

const state = {
  baseline: null,        // HTMLImageElement
  actual: null,
  guide: { x: 0.5, y: 0.55, w: 0.40 },  // waist point and body width, as fractions of the photo
};

const FIELDS = ["baseline-date", "height", "weight", "waist", "bodyfat", "sleep", "steps", "training",
  "weeks", "target-weight", "target-waist", "target-bodyfat", "strength-change", "nutrition", "adherence", "target-sleep",
  "checkin-date", "actual-weight", "actual-waist", "actual-bf", "body-width"];

const isoDate = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const readable = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
const n = (sel) => { const v = Number($(sel).value); return Number.isFinite(v) ? v : 0; };
const has = (sel) => $(sel).value !== "" && Number($(sel).value) > 0;
const signed = (x, unit = "", dp = 1) => `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(x).toFixed(dp)}${unit}`;
const dateOf = (sel) => new Date(`${$(sel).value}T12:00:00`);

// ── Persistence ────────────────────────────────────────────
let saveTimer;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const data = { v: {}, guide: state.guide, baseline: state.baseline?.src || null, actual: state.actual?.src || null };
    FIELDS.forEach((id) => { data.v[id] = $("#" + id).value; });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
    catch {
      try { delete data.actual; localStorage.setItem(STORE_KEY, JSON.stringify(data)); msg("#actual-msg", "Storage is full, so the check-in photo wasn't saved. It still shows until you leave the page."); }
      catch { /* storage unavailable (private mode): the app still works for this visit */ }
    }
  }, 250);
}
function loadImage(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
async function restore() {
  let data; try { data = JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { data = null; }
  if (!data) return false;
  Object.entries(data.v || {}).forEach(([id, val]) => { if ($("#" + id) && val !== undefined) $("#" + id).value = val; });
  if (data.guide) state.guide = data.guide;
  if (data.baseline) { try { setBaseline(await loadImage(data.baseline), false); } catch {} }
  if (data.actual) { try { setActual(await loadImage(data.actual), false); } catch {} }
  return true;
}

// ── Photo input ────────────────────────────────────────────
function msg(sel, text) { $(sel).textContent = text || ""; }

async function decodeFile(file) {
  const looksHeic = /hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type);
  let blob = file;
  try { return await toScaledImage(blob); }
  catch (e) {
    if (!looksHeic) throw new Error("unreadable");
  }
  // HEIC/HEIF (iPhone): browsers other than Safari can't show it, so convert it first.
  if (!window.heic2any) await new Promise((res, rej) => { const s = document.createElement("script"); s.src = HEIC_LIB; s.onload = res; s.onerror = () => rej(new Error("heic-lib")); document.head.appendChild(s); });
  const out = await window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  return toScaledImage(Array.isArray(out) ? out[0] : out);
}

async function toScaledImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const k = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return loadImage(c.toDataURL("image/jpeg", 0.86));
  } finally { URL.revokeObjectURL(url); }
}

function wireUpload(inputSel, dropSel, msgSel, onImage) {
  const input = $(inputSel), drop = $(dropSel);
  const handle = async (file) => {
    if (!file) return;
    if (file.size > 40 * 1024 * 1024) return msg(msgSel, "That file is over 40 MB. Choose a smaller photo.");
    msg(msgSel, /hei[cf]/i.test(file.name + file.type) ? "Converting iPhone photo…" : "Loading photo…");
    try { onImage(await decodeFile(file)); msg(msgSel, ""); }
    catch (e) {
      msg(msgSel, e.message === "heic-lib"
        ? "This iPhone (HEIC) photo needs a converter that couldn't load. Check your connection, or export it as JPG and try again."
        : "This file couldn't be read as a photo. Use a JPG or PNG. On iPhone, Settings → Camera → Formats → Most Compatible saves photos as JPG.");
    }
    input.value = "";
  };
  input.addEventListener("change", () => handle(input.files[0]));
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("dragging"); }));
  drop.addEventListener("drop", (e) => handle(e.dataTransfer.files[0]));
}
$$("[data-pick]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); $("#" + b.dataset.pick).click(); }));

function setBaseline(img, persist = true) {
  state.baseline = img;
  $("#baseline-preview").src = img.src;
  $("#baseline-drop").classList.add("has-image");
  $("#guide-controls").hidden = false;
  $("#waist-guide").hidden = false;
  placeGuide();
  updateProjection();
  if (persist) save();
}
function setActual(img, persist = true) {
  state.actual = img;
  $("#actual-preview").src = img.src;
  $("#actual-drop").classList.add("has-image");
  syncComparison();
  if (persist) save();
}
wireUpload("#baseline-photo", "#baseline-drop", "#baseline-msg", setBaseline);
wireUpload("#actual-photo", "#actual-drop", "#actual-msg", setActual);

// ── Body guide on the start photo (where the waist is, how wide the body is) ──
// The preview uses object-fit: cover, so map between screen and photo coordinates.
function coverBox(boxW, boxH, imgW, imgH) {
  const s = Math.max(boxW / imgW, boxH / imgH);
  return { s, x: (boxW - imgW * s) / 2, y: (boxH - imgH * s) / 2 };
}
function placeGuide() {
  const img = state.baseline; if (!img) return;
  const drop = $("#baseline-drop"), r = drop.getBoundingClientRect();
  const c = coverBox(r.width, r.height, img.naturalWidth, img.naturalHeight);
  const px = c.x + state.guide.x * img.naturalWidth * c.s, py = c.y + state.guide.y * img.naturalHeight * c.s;
  const half = state.guide.w / 2 * img.naturalWidth * c.s;
  const g = $("#waist-guide");
  g.style.top = py + "px";
  g.querySelector(".wg-l").style.left = (px - half) + "px";
  g.querySelector(".wg-r").style.left = (px + half) + "px";
  g.querySelector("b").style.left = px + "px";
  $("#body-width").value = Math.round(state.guide.w * 100);
  $("#body-width-output").textContent = `${Math.round(state.guide.w * 100)}%`;
}
$("#baseline-drop").addEventListener("click", (e) => {
  const img = state.baseline; if (!img || e.target.closest("button")) return;
  const r = $("#baseline-drop").getBoundingClientRect();
  const c = coverBox(r.width, r.height, img.naturalWidth, img.naturalHeight);
  state.guide.x = Math.min(0.95, Math.max(0.05, (e.clientX - r.left - c.x) / c.s / img.naturalWidth));
  state.guide.y = Math.min(0.92, Math.max(0.15, (e.clientY - r.top - c.y) / c.s / img.naturalHeight));
  placeGuide(); updateProjection(); save();
});
$("#body-width").addEventListener("input", () => { state.guide.w = n("#body-width") / 100; placeGuide(); updateProjection(); save(); });
window.addEventListener("resize", placeGuide);

// ── Navigation ─────────────────────────────────────────────
function navigate(step) {
  $$(".panel").forEach((p) => p.classList.toggle("active", p.id === `step-${step}`));
  $$(".step").forEach((b) => b.classList.toggle("active", Number(b.dataset.step) === step));
  $(".stepper").scrollIntoView({ behavior: "smooth", block: "start" });
  if (step === 1) requestAnimationFrame(placeGuide);
  if (step === 2) updateProjection();
  if (step === 3) syncComparison();
}
$$(".step").forEach((b) => b.addEventListener("click", () => {
  const step = Number(b.dataset.step);
  if (step > 1 && !validateBaseline(false)) return;
  navigate(step);
}));
$$(".next").forEach((b) => b.addEventListener("click", () => {
  if (!validateBaseline(true)) return;
  navigate(Number(b.dataset.next));
}));

function validateBaseline(loud) {
  let ok = true;
  ["#baseline-date", "#height", "#weight", "#waist"].forEach((sel) => {
    const el = $(sel), good = el.type === "date" ? !!el.value : Number(el.value) > 0;
    el.style.borderColor = good || !loud ? "" : "#e05a5a"; ok = ok && good;
  });
  if (!ok && loud) msg("#baseline-msg", "Add your date, height, weight and waist to continue.");
  if (ok) initializeTargets();
  return ok;
}
function initializeTargets() {
  if (!$("#target-weight").value) $("#target-weight").value = Math.max(35, n("#weight") * 0.94).toFixed(1);
  if (!$("#target-waist").value) $("#target-waist").value = Math.max(45, n("#waist") * 0.94).toFixed(1);
  if (!$("#target-bodyfat").value && has("#bodyfat")) $("#target-bodyfat").value = Math.max(3, n("#bodyfat") - 3).toFixed(1);
}

// ── The plan, at any point in time ─────────────────────────
function targetDate() { const d = dateOf("#baseline-date"); d.setDate(d.getDate() + n("#weeks") * 7); return d; }
// Expected values `p` of the way (0..1) from start to target.
function planAt(p) {
  const at = (a, b) => (a && b ? a + (b - a) * p : 0);
  return {
    weight: at(n("#weight"), n("#target-weight")),
    waist: at(n("#waist"), n("#target-waist")),
    bf: has("#bodyfat") && has("#target-bodyfat") ? at(n("#bodyfat"), n("#target-bodyfat")) : 0,
    strength: n("#strength-change") * p,
  };
}
function checkinProgress() {
  const start = dateOf("#baseline-date"), end = targetDate(), ci = dateOf("#checkin-date");
  return Math.max(0, Math.min(1, (ci - start) / Math.max(1, end - start)));
}

function updateProjection() {
  initializeTargets();
  const weeks = n("#weeks"), end = targetDate();
  $("#weeks-output").textContent = `${weeks} weeks`;
  $("#target-date-label").textContent = `Target date · ${readable(end)}`;
  $("#projection-date").textContent = readable(end);
  $("#nutrition-output").textContent = `${n("#nutrition")}%`;
  $("#adherence-output").textContent = `${n("#adherence")}%`;
  $("#target-sleep-output").textContent = `${n("#target-sleep").toFixed(1)}h`;

  const w0 = n("#weight"), c0 = n("#waist"), b0 = n("#bodyfat");
  const w1 = n("#target-weight"), c1 = n("#target-waist"), b1 = n("#target-bodyfat");
  $("#projected-weight-display").textContent = w1 ? `${w1.toFixed(1)} kg` : "—";
  $("#projected-waist-display").textContent = c1 ? `${c1.toFixed(1)} cm` : "—";
  $("#projected-bf-display").textContent = b1 ? `${b1.toFixed(1)}%` : "—";
  $("#projected-weight-delta").textContent = w1 ? `${signed(w1 - w0, " kg")} change` : "—";
  $("#projected-waist-delta").textContent = c1 ? `${signed(c1 - c0, " cm")} change` : "—";
  $("#projected-bf-delta").textContent = b1 && b0 ? `${signed(b1 - b0, " pts")} change` : "Add a start body fat %";

  const rate = w0 && weeks ? Math.abs(w1 - w0) / w0 / weeks * 100 : 0;
  const waistRate = c0 && weeks ? Math.abs(c1 - c0) / weeks : 0;
  const warn = rate > 1 || (w1 < w0 && rate > 0.85) || waistRate > 1;
  $("#rate-card").classList.toggle("warning", warn);
  $("#rate-title").textContent = warn ? "Aggressive pace" : "Sustainable pace";
  $("#rate-copy").textContent = warn
    ? `${rate.toFixed(2)}% of body weight and ${waistRate.toFixed(1)} cm of waist a week is hard to sustain. Consider more time or a smaller change.`
    : `${rate.toFixed(2)}% of body weight and ${waistRate.toFixed(1)} cm of waist a week sits in a commonly manageable range.`;
  $(".rate-icon").textContent = warn ? "!" : "✓";

  if (state.baseline) {
    renderProjection($("#projection-canvas"), 1);
    $("#projection-canvas").style.display = "block";
    $("#empty-projection").style.display = "none";
  }
}

// ── Projection rendering ───────────────────────────────────
// Reshapes only the body. Around the waist line the torso narrows (or widens) by the
// planned waist change; weight change scales the whole body width; strength adds a
// little shoulder width; a body-fat drop adds a touch of definition. Pixels further than
// ~1.8× the body's half-width from its centre line are left exactly as they were,
// so the background never stretches.
// Every rendered image uses the start photo's proportions (portrait stays portrait).
function frame() {
  const img = state.baseline;
  const h = img ? Math.round(OUT * img.naturalHeight / img.naturalWidth) : OUT;
  return { W: OUT, H: Math.max(400, Math.min(1100, h)) };
}
function drawCover(ctx, img, W, H) {
  const c = coverBox(W, H, img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, c.x, c.y, img.naturalWidth * c.s, img.naturalHeight * c.s);
  return c;
}
function renderProjection(canvas, p) {
  const img = state.baseline; if (!img) return;
  const { W, H } = frame();
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const c = drawCover(ctx, img, W, H);
  const plan = planAt(p);
  const w0 = n("#weight"), c0 = n("#waist"), b0 = n("#bodyfat");

  const cx = c.x + state.guide.x * img.naturalWidth * c.s;
  const waistY = c.y + state.guide.y * img.naturalHeight * c.s;
  const half = Math.max(8, state.guide.w / 2 * img.naturalWidth * c.s);   // body half-width at the waist
  const torso = half * 2.2;                                                 // ≈ shoulder-to-waist height in px
  const shoulderY = waistY - torso, headY = waistY - torso * 1.45;

  const weightK = w0 && plan.weight ? Math.sqrt(plan.weight / w0) - 1 : 0;    // width scales ~ with sqrt(mass)
  const waistK = c0 && plan.waist ? (plan.waist / c0 - 1) : 0;
  const strengthK = plan.strength / 100 * 0.10;
  const g = (y, mu, sd) => Math.exp(-(((y - mu) / sd) ** 2));
  const scaleAt = (y) => {
    const body = y < headY ? 0 : Math.min(1, (y - headY) / (torso * 0.45));   // head mostly unchanged
    return 1 + weightK * body
             + (waistK - weightK) * g(y, waistY, torso * 0.42)                  // waist follows its own target
             + strengthK * g(y, shoulderY, torso * 0.28);
  };

  const src = ctx.getImageData(0, 0, W, H), dst = ctx.createImageData(W, H);
  const S = src.data, Dd = dst.data, W2 = half * 1.8;
  for (let y = 0; y < H; y++) {
    const s = Math.max(0.5, Math.min(1.6, scaleAt(y)));
    const k = (W2 - half * s) / (W2 - half);          // slope of the blend zone, keeps the mapping continuous
    for (let x = 0; x < W; x++) {
      const d = x - cx, ad = Math.abs(d);
      let sd;                                          // source distance for this output pixel
      if (ad <= half * s) sd = ad / s;
      else if (ad <= W2) sd = half + (ad - half * s) / k;
      else sd = ad;
      const sx = cx + Math.sign(d) * sd;
      const x0 = Math.floor(sx), t = sx - x0, xa = Math.max(0, Math.min(W - 1, x0)), xb = Math.max(0, Math.min(W - 1, x0 + 1));
      const i = (y * W + x) * 4, ia = (y * W + xa) * 4, ib = (y * W + xb) * 4;
      Dd[i] = S[ia] + (S[ib] - S[ia]) * t; Dd[i + 1] = S[ia + 1] + (S[ib + 1] - S[ia + 1]) * t;
      Dd[i + 2] = S[ia + 2] + (S[ib + 2] - S[ia + 2]) * t; Dd[i + 3] = 255;
    }
  }
  ctx.putImageData(dst, 0, 0);

  // Definition: a soft local-contrast lift over the torso when body fat is planned to drop.
  const bfDrop = b0 && plan.bf ? Math.max(0, b0 - plan.bf) : 0;
  if (bfDrop > 0.2) {
    const layer = document.createElement("canvas"); layer.width = W; layer.height = H;
    const l = layer.getContext("2d");
    l.filter = `contrast(${100 + Math.min(18, bfDrop * 3)}%) saturate(${100 + Math.min(8, bfDrop)}%)`;
    l.drawImage(canvas, 0, 0); l.filter = "none";
    l.globalCompositeOperation = "destination-in";
    const grad = l.createRadialGradient(cx, (waistY + shoulderY) / 2, half * 0.3, cx, (waistY + shoulderY) / 2, half * 1.9);
    grad.addColorStop(0, "rgba(0,0,0,1)"); grad.addColorStop(1, "rgba(0,0,0,0)");
    l.fillStyle = grad; l.fillRect(0, 0, W, H);
    ctx.drawImage(layer, 0, 0);
  }
}

FIELDS.filter((id) => !id.startsWith("actual") && id !== "checkin-date" && id !== "body-width")
  .forEach((id) => $("#" + id).addEventListener("input", () => { updateProjection(); save(); }));
["checkin-date", "actual-weight", "actual-waist", "actual-bf"].forEach((id) =>
  $("#" + id).addEventListener("input", () => { syncComparison(); save(); }));

// ── Check-in: start, projection for the check-in date, actual ──
function drawInto(canvas, img) {
  const { W, H } = frame();
  canvas.width = W; canvas.height = H;
  drawCover(canvas.getContext("2d"), img, W, H);
}
const fmt = (v, unit) => (v ? `${v.toFixed(1)}${unit}` : "—");

function syncComparison() {
  const p = checkinProgress(), plan = planAt(p), ci = dateOf("#checkin-date");
  $("#cmp-start-date").textContent = readable(dateOf("#baseline-date"));
  $("#cmp-start-weight").textContent = fmt(n("#weight"), " kg");
  $("#cmp-start-waist").textContent = fmt(n("#waist"), " cm");
  $("#cmp-start-bf").textContent = has("#bodyfat") ? fmt(n("#bodyfat"), "%") : "—";
  $("#compare-projected-date").textContent = readable(ci);
  $("#compare-target-weight").textContent = fmt(plan.weight, " kg");
  $("#compare-target-waist").textContent = fmt(plan.waist, " cm");
  $("#compare-target-bf").textContent = plan.bf ? fmt(plan.bf, "%") : "—";
  const weeksIn = Math.max(0, Math.round((ci - dateOf("#baseline-date")) / 6048e5 * 10) / 10);
  $("#compare-note").textContent = `Check-in is ${weeksIn} of ${n("#weeks")} weeks in (${Math.round(p * 100)}% of the plan), so the projection shows where the plan expects you to be on that day.`;
  $("#variance-progress").textContent = `${Math.round(p * 100)}% through the plan`;

  if (state.baseline) { drawInto($("#cmp-start"), state.baseline); renderProjection($("#compare-canvas"), p); }
  drawSwipe();
  renderVariance(p, plan);
}

let swipeMode = "proj";
$$(".swipe-mode").forEach((b) => b.addEventListener("click", () => {
  swipeMode = b.dataset.mode;
  $$(".swipe-mode").forEach((x) => x.classList.toggle("active", x === b));
  $("#swipe-left").textContent = swipeMode === "proj" ? "Projected" : "Start";
  drawSwipe();
}));
$("#swipe").addEventListener("input", drawSwipe);

function drawSwipe() {
  const canvas = $("#swipe-canvas"), ctx = canvas.getContext("2d");
  const ready = state.actual && state.baseline;
  $("#swipe-empty").style.display = ready ? "none" : "grid";
  if (!ready) { ctx.clearRect(0, 0, canvas.width, canvas.height); return; }
  const left = swipeMode === "proj" ? $("#compare-canvas") : $("#cmp-start");
  const { W, H } = frame();
  if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  const cut = W * n("#swipe") / 100;
  ctx.clearRect(0, 0, W, H);
  drawCover(ctx, state.actual, W, H);           // the actual photo is framed like the start photo
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cut, H); ctx.clip();
  ctx.drawImage(left, 0, 0, W, H); ctx.restore();
  ctx.fillStyle = "#c8a96e"; ctx.fillRect(cut - 1, 0, 2, H);
}

function renderVariance(p, plan) {
  const rows = [
    { name: "Weight", unit: " kg", start: n("#weight"), exp: plan.weight, act: n("#actual-weight"), lowerIsGood: n("#target-weight") <= n("#weight") },
    { name: "Waist", unit: " cm", start: n("#waist"), exp: plan.waist, act: n("#actual-waist"), lowerIsGood: n("#target-waist") <= n("#waist") },
    { name: "Body fat", unit: "%", start: has("#bodyfat") ? n("#bodyfat") : 0, exp: plan.bf, act: n("#actual-bf"), lowerIsGood: true },
  ];
  $("#variance-table tbody").innerHTML = rows.map((r) => {
    const vs = r.act && r.exp ? r.act - r.exp : null;
    const since = r.act && r.start ? r.act - r.start : null;
    const good = vs == null ? "" : Math.abs(vs) < 0.05 ? "ok" : (vs < 0) === r.lowerIsGood ? "up" : "dn";
    return `<tr><th>${r.name}</th><td>${fmt(r.start, r.unit)}</td><td>${fmt(r.exp, r.unit)}</td><td>${fmt(r.act, r.unit)}</td>` +
      `<td class="${good}">${vs == null ? "—" : signed(vs, r.unit)}</td><td>${since == null ? "—" : signed(since, r.unit)}</td></tr>`;
  }).join("");
}

function calculateVerdict() {
  const p = checkinProgress(), plan = planAt(p);
  const metrics = [
    { name: "Weight", base: n("#weight"), target: n("#target-weight"), exp: plan.weight, act: n("#actual-weight"), unit: " kg" },
    { name: "Waist", base: n("#waist"), target: n("#target-waist"), exp: plan.waist, act: n("#actual-waist"), unit: " cm" },
    { name: "Body fat", base: n("#bodyfat"), target: n("#target-bodyfat"), exp: plan.bf, act: n("#actual-bf"), unit: "%" },
  ].filter((m) => m.base && m.target && m.act);
  if (!metrics.length) { msg("#actual-msg", "Add at least one actual measurement (weight, waist or body fat) to get a verdict."); return; }
  msg("#actual-msg", "");
  const scored = metrics.map((m) => {
    const total = Math.abs(m.target - m.base) || 1;
    return { ...m, delta: m.act - m.exp, score: Math.max(0, 100 - Math.abs(m.act - m.exp) / total * 100) };
  });
  const score = Math.round(scored.reduce((a, m) => a + m.score, 0) / scored.length);
  let title = "Plan needs an adjustment", copy = "Your numbers are well off the projected path for this date. Review consistency and recovery, or reset the target or timeline.";
  if (score >= 90) { title = "Right on the line"; copy = "Your numbers closely match where the projection expected you to be today."; }
  else if (score >= 75) { title = "On track"; copy = "Close to the projected path. Keep the process steady and check in again."; }
  else if (score >= 55) { title = "Within striking distance"; copy = "A visible gap, but still workable. Focus on the behaviour you've been least consistent with."; }
  $("#verdict-score").textContent = score;
  $("#verdict-title").textContent = title;
  $("#verdict-text").textContent = copy;
  $("#verdict-deltas").innerHTML = scored.map((m) => `<span class="delta-pill">${m.name} vs plan<b>${signed(m.delta, m.unit)}</b></span>`).join("");
  $("#verdict-card").scrollIntoView({ behavior: "smooth", block: "center" });
}
$("#calculate-verdict").addEventListener("click", calculateVerdict);

$("#reset-app").addEventListener("click", () => {
  if (!confirm("Delete your saved photos and numbers from this device and start a new baseline?")) return;
  try { localStorage.removeItem(STORE_KEY); } catch {}
  location.reload();
});

// ── Start ──────────────────────────────────────────────────
(async () => {
  const today = isoDate(new Date());
  const restored = await restore();
  if (!$("#baseline-date").value) $("#baseline-date").value = today;
  // Returning on check-in day: default the check-in to today unless a check-in was already recorded.
  const recorded = has("#actual-weight") || has("#actual-waist") || has("#actual-bf") || state.actual;
  if (!$("#checkin-date").value || !recorded) $("#checkin-date").value = today;
  updateProjection();
  if (restored && state.baseline) msg("#baseline-msg", "Restored your saved start photo and numbers from this device.");
})();
