// ══════════════════════════════════════════════════════════
// Cut to 165 — Block 1 progress (the whole of training.html)
//
// DATA: three tables with these exact column headers:
//   checkin  — cut_wk, week_of, block_wk, phase, target_lb, avg_lb, delta_lb,
//              rate3_lb_wk, waist_cm, avg_steps, protein_days, sessions,
//              sleep_h, hunger, scale_reading, decision, days_logged
//   weighins — date, weight_lb, cut_wk
//   lifts    — block_wk, week_of, cut_wk, day, exercise, main, sets, rep_range,
//              load_kg, set1, set2, set3, rir, e1rm, next_kg, coach, block23_kg
//
// LIVE: put the Google Sheet's ID in CUT165_SHEET_ID. The sheet must be shared
// "Anyone with the link → Viewer" and have three tabs named exactly
// checkin, weighins and lifts with the headers above. Until then (or if the
// fetch fails) the page uses the snapshot CSVs in data/cut165/.
// ══════════════════════════════════════════════════════════
(function () {
  const CUT165_SHEET_ID = '';
  const SNAPSHOT_DATE = '8 Nov 2026';
  const START_LB = 184.5, GOAL_LB = 165, RATE_TRIGGER = 1.0;
  const HEIGHT_CM = 170.18, NECK_CM = 38;
  const TABS = ['checkin', 'weighins', 'lifts'];

  const C = { gold: '#c8a96e', green: '#4caf7d', red: '#e05a5a', blue: '#6b9fd4', orange: '#d4956b',
              muted: 'rgba(240,237,232,0.38)', faint: 'rgba(240,237,232,0.12)' };
  const grid = { color: 'rgba(240,237,232,0.04)' };
  const tick = { font: { size: 9 }, color: 'rgba(240,237,232,0.35)' };
  const legend = { display: true, labels: { color: 'rgba(240,237,232,.45)', font: { size: 9 }, boxWidth: 10, boxHeight: 2 } };
  const charts = {};
  const $ = (id) => document.getElementById(id);
  const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? null : Number(v));
  const r1 = (x) => Math.round(x * 10) / 10;
  const f1 = (x) => (x == null ? '—' : x.toFixed(1));
  const sgn = (x) => (x == null ? '—' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1));
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Dates may arrive as 2026-09-14 (CSV snapshot) or in a sheet's display format
  // (14/09/2026 in an Irish-locale sheet, 9/14/2026 in a US one). The day/month
  // order is decided once from all the dates (any value above 12 settles it),
  // defaulting to day/month. Everything is normalised to YYYY-MM-DD.
  let monthFirst = false;
  const learnDateOrder = (vals) => {
    for (const v of vals) {
      const m = String(v || '').trim().match(/^(\d{1,2})[\/.](\d{1,2})[\/.]\d{4}$/);
      if (!m) continue;
      if (+m[2] > 12) { monthFirst = true; return; }
      if (+m[1] > 12) { monthFirst = false; return; }
    }
  };
  const isoDate = (v) => {
    v = String(v || '').trim(); let m;
    if ((m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    if ((m = v.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/))) {
      const [mo, d] = monthFirst ? [m[1], m[2]] : [m[2], m[1]];
      return `${m[3]}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const t = Date.parse(v); return isNaN(t) ? v : new Date(t).toISOString().slice(0, 10);
  };
  const fmtDate = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-IE', { day: 'numeric', month: 'short', timeZone: 'UTC' });

  // ── CSV ────────────────────────────────────────────────
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map((h) => h.trim().toLowerCase());
    return rows.filter((r) => r.some((c) => c.trim() !== '')).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
  }
  async function getText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(res.status + ' ' + url);
    return res.text();
  }
  async function loadData() {
    if (CUT165_SHEET_ID) {
      try {
        const out = {};
        for (const t of TABS) {
          const rows = parseCSV(await getText(`https://docs.google.com/spreadsheets/d/${CUT165_SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(t)}`));
          const need = t === 'checkin' ? 'cut_wk' : t === 'weighins' ? 'weight_lb' : 'exercise';
          if (!rows.length || !(need in rows[0])) throw new Error('tab ' + t + ' missing or wrong headers');
          out[t] = rows;
        }
        return { ...out, live: true };
      } catch (e) { console.warn('Cut 165 live fetch failed, using snapshot:', e); }
    }
    const out = {};
    for (const t of TABS) out[t] = parseCSV(await getText(`data/cut165/${t}.csv`));
    return { ...out, live: false, attempted: !!CUT165_SHEET_ID };
  }

  // ── Derived figures (same formulas as the Block 1 dashboard) ──
  function derive(d) {
    learnDateOrder([...d.weighins.map((r) => r.date), ...d.checkin.map((r) => r.week_of)]);
    const checkin = d.checkin.map((r) => ({ ...r, week_of: isoDate(r.week_of), cut_wk: num(r.cut_wk), target_lb: num(r.target_lb), avg_lb: num(r.avg_lb), delta_lb: num(r.delta_lb),
      rate3: num(r.rate3_lb_wk), waist_cm: num(r.waist_cm), steps: num(r.avg_steps), sleep_h: num(r.sleep_h), hunger: num(r.hunger), days: num(r.days_logged) || 0 }));
    const weighins = d.weighins.map((r) => ({ date: isoDate(r.date), w: num(r.weight_lb), cut_wk: num(r.cut_wk) })).filter((r) => r.w != null && r.date);

    const bodyfat = checkin.filter((r) => r.waist_cm != null && r.avg_lb != null).map((r) => {
      const w = r.waist_cm, lb = r.avg_lb;
      const navy = 495 / (1.0324 - 0.19077 * Math.log10(w - NECK_CM) + 0.15456 * Math.log10(HEIGHT_CM)) - 450;
      const ymca = (-98.42 + 4.15 * (w / 2.54) - 0.082 * lb) / lb * 100;
      const rfm = 64 - 20 * (HEIGHT_CM / w);
      return { cut_wk: r.cut_wk, week_of: r.week_of, waist_cm: w, weight_lb: r1(lb), navy: r1(navy), ymca: r1(ymca), rfm: r1(rfm),
               fat_lb: r1(lb * navy / 100), lean_lb: r1(lb * (1 - navy / 100)) };
    });

    const by = {};
    for (const r of d.lifts) (by[r.exercise] = by[r.exercise] || []).push(r);
    const lifts = Object.values(by).map((rs) => {
      rs.sort((a, b) => num(a.block_wk) - num(b.block_wk));
      const f = rs[0], l = rs[rs.length - 1], e0 = num(f.e1rm), e1 = num(l.e1rm);
      return { exercise: f.exercise, day: f.day, main: f.main === 'Y', block23_kg: num(f.block23_kg), wk1_kg: num(f.load_kg), latest_kg: num(l.load_kg),
               latest_wk: num(l.block_wk), next_kg: num(l.next_kg), e1rm_latest: e1, e1rm_change: e0 && e1 ? e1 / e0 - 1 : null, coach: l.coach,
               series: rs.map((r) => ({ wk: num(r.block_wk), e1rm: num(r.e1rm) })) };
    });

    const full = checkin.filter((r) => r.days === 7 && r.avg_lb != null);
    const part = checkin.filter((r) => r.days > 0 && r.days < 7);
    const last = full[full.length - 1], first = full[0], p = part[part.length - 1];
    const main = lifts.filter((r) => r.main);
    const head = last ? {
      cut_wk: last.cut_wk, week_of: last.week_of, avg: r1(last.avg_lb), delta: r1(last.delta_lb ?? 0), lost: r1(START_LB - last.avg_lb), to_go: r1(last.avg_lb - GOAL_LB),
      vs_target: r1(last.avg_lb - last.target_lb), waist: last.waist_cm, waist_change: r1((last.waist_cm ?? 0) - (first.waist_cm ?? 0)),
      rate3: last.rate3, decision: last.decision,
      main_up: main.filter((r) => r.e1rm_change > 0).length, main_total: main.length,
      partial: p ? { wk: p.cut_wk, days: p.days, avg: p.avg_lb != null ? r1(p.avg_lb) : null } : null,
      bf: bodyfat.length ? bodyfat[bodyfat.length - 1].navy : null,
      bf_change: bodyfat.length > 1 ? r1(bodyfat[bodyfat.length - 1].navy - bodyfat[0].navy) : null,
      goal_date: checkin.length ? checkin[checkin.length - 1].week_of : null,
    } : null;
    return { checkin, weighins, bodyfat, lifts, head };
  }

  // ── Rendering ──────────────────────────────────────────
  function mk(id, cfg) { if (charts[id]) charts[id].destroy(); charts[id] = new Chart($(id), cfg); }
  const cls = (v, good) => (v == null ? '' : good(v) ? 'up' : 'dn');

  function card(lbl, val, sub, valCls = '') {
    return `<div class="card"><div class="card-lbl">${lbl}</div><div class="card-val ${valCls}">${val}</div><div class="card-sub">${sub}</div></div>`;
  }

  function render(D, live) {
    const h = D.head;
    $('cut-load').style.display = 'none';
    $('cut-body').style.display = '';
    $('cut-source').textContent = live ? 'Live from Google Sheet' : `Snapshot · data up to ${SNAPSHOT_DATE}`;
    const pill = $('cut-pill');
    if (pill) {
      pill.textContent = live ? 'Live data' : `Data to ${SNAPSHOT_DATE.replace(/ \d{4}$/, '')}`;
      const dot = pill.previousElementSibling; if (dot && !live) { dot.style.background = 'var(--orange)'; dot.style.animation = 'none'; }
    }
    if (!h) { $('cut-headline').textContent = 'No complete check-in week yet.'; return; }

    $('cut-headline').innerHTML = `Week ${h.cut_wk} averaged <b>${f1(h.avg)} lb</b>: ${f1(h.lost)} lb down from ${f1(START_LB)}, ` +
      `<span class="${h.vs_target <= 0 ? 'up' : 'dn'}">${sgn(h.vs_target)} lb</span> vs plan, and ${h.main_up} of ${h.main_total} main lifts are stronger than Block 1 week 1.`;

    $('cut-cards').innerHTML = [
      card('7-day avg · wk ' + h.cut_wk, f1(h.avg), `<span class="${h.delta < 0 ? 'up' : 'dn'}">${sgn(h.delta)} lb</span> vs week before`, 'accent'),
      card('Lost since 14 Sep', f1(h.lost), `${f1(h.to_go)} lb to go to ${GOAL_LB}`),
      card('Waist at navel', f1(h.waist), `<span class="${h.waist_change < 0 ? 'up' : h.waist_change > 0 ? 'dn' : ''}">${sgn(h.waist_change)} cm</span> since week 1`),
      card('3-week loss rate', h.rate3 == null ? '—' : h.rate3.toFixed(2), `lb/wk · step down below ${f1(RATE_TRIGGER)}`, h.rate3 >= RATE_TRIGGER ? 'green' : 'red'),
      card('Main lifts stronger', `${h.main_up}/${h.main_total}`, 'e1RM vs Block 1 wk 1'),
      card('Body fat · US Navy', f1(h.bf) + '%', `<span class="${h.bf_change < 0 ? 'up' : 'dn'}">${sgn(h.bf_change)} pts</span> since week 1`),
    ].join('');

    const dec = $('cut-decision');
    dec.className = 'sug ' + (/drop|step/i.test(h.decision || '') ? 'warn' : 'good');
    dec.innerHTML = `<div class="sug-title">This week's call · after week ${h.cut_wk}</div><div class="sug-body">${esc(h.decision || '—')}</div>`;
    const pn = $('cut-partial');
    if (h.partial && h.partial.avg != null) {
      pn.style.display = '';
      pn.innerHTML = `Week ${h.partial.wk} is in progress: ${h.partial.days} of 7 weigh-ins, averaging ${f1(h.partial.avg)} lb. A part week swings with water, so the tiles use the last full week.`;
    } else pn.style.display = 'none';

    drawWeight(D); drawWaist(D); drawLoss(D); drawBF(D); drawMass(D); drawBFTable(D); drawStrength(D); drawExercises(D); drawCheckins(D);
  }

  function drawWeight(D) {
    const weeks = D.checkin, days = D.weighins;
    const end = new Date(weeks[weeks.length - 1].week_of + 'T00:00:00Z'); end.setUTCDate(end.getUTCDate() + 6);
    const target = []; for (const w of weeks) { const s = Date.parse(w.week_of + 'T00:00:00Z'); target.push({ x: s, y: w.target_lb }, { x: s + 6 * 864e5, y: w.target_lb }); }
    const avg = weeks.filter((w) => w.avg_lb != null && w.days === 7).map((w) => ({ x: Date.parse(w.week_of + 'T00:00:00Z') + 3 * 864e5, y: w.avg_lb, wk: w.cut_wk }));
    $('cut-goal-date').textContent = end.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
    mk('cut-ch-weight', { type: 'line', data: { datasets: [
      { label: 'Daily weigh-in', data: days.map((d) => ({ x: Date.parse(d.date + 'T00:00:00Z'), y: d.w })), showLine: false, pointRadius: 2, pointHoverRadius: 4, pointBackgroundColor: 'rgba(240,237,232,.35)', borderColor: 'transparent' },
      { label: '7-day average', data: avg, borderColor: C.gold, backgroundColor: C.gold, borderWidth: 2, pointRadius: 3, tension: .25 },
      { label: 'Plan', data: target, borderColor: C.muted, borderWidth: 1, borderDash: [4, 3], pointRadius: 0, stepped: false },
      { label: 'Goal ' + GOAL_LB, data: [{ x: Date.parse(weeks[0].week_of + 'T00:00:00Z'), y: GOAL_LB }, { x: end.getTime(), y: GOAL_LB }], borderColor: 'rgba(76,175,125,.5)', borderWidth: 1, pointRadius: 0 },
    ] }, options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'nearest', intersect: false },
      plugins: { legend, tooltip: { callbacks: { title: (it) => new Date(it[0].parsed.x).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' }), label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(1)} lb` } } },
      scales: { x: { type: 'linear', min: Date.parse(weeks[0].week_of + 'T00:00:00Z'), max: end.getTime(), grid: { display: false },
        ticks: { ...tick, maxTicksLimit: 8, callback: (v) => new Date(v).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' }) } },
        y: { grid, ticks: tick, suggestedMin: GOAL_LB - 1 } } } });
  }

  function drawWaist(D) {
    const w = D.checkin.filter((r) => r.waist_cm != null);
    mk('cut-ch-waist', { type: 'line', data: { labels: w.map((r) => 'Wk ' + r.cut_wk), datasets: [{ data: w.map((r) => r.waist_cm), borderColor: C.blue, backgroundColor: 'rgba(107,159,212,.08)', fill: true, borderWidth: 1.5, pointRadius: 3, tension: .25 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y.toFixed(1) + ' cm' } } }, scales: { x: { grid: { display: false }, ticks: tick }, y: { grid, ticks: tick } } } });
  }

  function drawLoss(D) {
    const w = D.checkin.filter((r) => r.delta_lb != null && r.days === 7);
    const loss = w.map((r) => r1(-r.delta_lb));
    mk('cut-ch-loss', { type: 'bar', data: { labels: w.map((r) => 'Wk ' + r.cut_wk), datasets: [
      { type: 'line', label: `${RATE_TRIGGER} lb/wk trigger`, data: w.map(() => RATE_TRIGGER), borderColor: C.muted, borderDash: [4, 3], borderWidth: 1, pointRadius: 0 },
      { label: 'Loss', data: loss, backgroundColor: loss.map((v) => (v >= RATE_TRIGGER ? 'rgba(76,175,125,.55)' : v >= 0 ? 'rgba(212,149,107,.55)' : 'rgba(224,90,90,.55)')), borderRadius: 2 },
    ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.datasetIndex ? `${c.parsed.y >= 0 ? 'Lost' : 'Gained'} ${Math.abs(c.parsed.y).toFixed(1)} lb` : c.dataset.label } } },
      scales: { x: { grid: { display: false }, ticks: tick }, y: { grid, ticks: tick } } } });
  }

  function drawBF(D) {
    const b = D.bodyfat, labels = b.map((r) => 'Wk ' + r.cut_wk);
    mk('cut-ch-bf', { type: 'line', data: { labels, datasets: [
      { label: 'US Navy', data: b.map((r) => r.navy), borderColor: C.gold, borderWidth: 2, pointRadius: 2, tension: .25 },
      { label: 'YMCA', data: b.map((r) => r.ymca), borderColor: C.blue, borderWidth: 1.5, pointRadius: 2, tension: .25 },
      { label: 'RFM', data: b.map((r) => r.rfm), borderColor: C.orange, borderWidth: 1.5, pointRadius: 2, tension: .25 },
      { label: '15% surplus ceiling', data: b.map(() => 15), borderColor: 'rgba(76,175,125,.5)', borderDash: [4, 3], borderWidth: 1, pointRadius: 0 },
    ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(1)}%` } } }, scales: { x: { grid: { display: false }, ticks: tick }, y: { grid, ticks: tick } } } });
  }

  function drawMass(D) {
    const b = D.bodyfat;
    mk('cut-ch-mass', { type: 'bar', data: { labels: b.map((r) => 'Wk ' + r.cut_wk), datasets: [
      { label: 'Lean', data: b.map((r) => r.lean_lb), backgroundColor: 'rgba(107,159,212,.5)', borderRadius: 2 },
      { label: 'Fat', data: b.map((r) => r.fat_lb), backgroundColor: 'rgba(200,169,110,.6)', borderRadius: 2 },
    ] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y.toFixed(1)} lb` } } },
      scales: { x: { stacked: true, grid: { display: false }, ticks: tick }, y: { stacked: true, grid, ticks: tick } } } });
  }

  function drawBFTable(D) {
    $('cut-bf-table').innerHTML = '<tr><th>Cut wk</th><th>Waist cm</th><th>Avg lb</th><th>Navy %</th><th>YMCA %</th><th>RFM %</th><th>Fat lb</th><th>Lean lb</th></tr>' +
      D.bodyfat.map((r) => `<tr><td>${r.cut_wk}</td><td>${f1(r.waist_cm)}</td><td>${f1(r.weight_lb)}</td><td style="color:var(--text)">${f1(r.navy)}</td><td>${f1(r.ymca)}</td><td>${f1(r.rfm)}</td><td>${f1(r.fat_lb)}</td><td>${f1(r.lean_lb)}</td></tr>`).join('');
  }

  function drawStrength(D) {
    const main = D.lifts.filter((r) => r.main);
    const wks = [...new Set(D.lifts.flatMap((r) => r.series.map((s) => s.wk)))].sort((a, b) => a - b);
    const palette = [C.gold, C.blue, C.green, C.orange, '#b59ad6', '#d6c38a', '#7fc4c0', C.red];
    mk('cut-ch-strength', { type: 'line', data: { labels: wks.map((w) => 'Blk wk ' + w), datasets: main.map((l, i) => {
      const e0 = l.series[0].e1rm;
      return { label: l.exercise, data: wks.map((w) => { const s = l.series.find((x) => x.wk === w); return s && e0 ? r1((s.e1rm / e0 - 1) * 100) : null; }),
               borderColor: palette[i % palette.length], borderWidth: 1.5, pointRadius: 2, tension: .25, spanGaps: true };
    }) }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend, tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y > 0 ? '+' : ''}${c.parsed.y.toFixed(1)}%` } } },
      scales: { x: { grid: { display: false }, ticks: tick }, y: { grid, ticks: { ...tick, callback: (v) => (v > 0 ? '+' : '') + v + '%' } } } } });
  }

  let sortKey = 'day', sortDir = 1;
  function drawExercises(D) {
    const cols = [['exercise', 'Exercise'], ['day', 'Day'], ['block23_kg', 'Blk 23 kg'], ['wk1_kg', 'Wk 1 kg'], ['latest_kg', 'Latest kg'], ['next_kg', 'Next kg'], ['e1rm_latest', 'e1RM'], ['e1rm_change', 'vs wk 1']];
    const rows = [...D.lifts].sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      if (x == null) return 1; if (y == null) return -1;
      return (typeof x === 'string' ? x.localeCompare(y) : x - y) * sortDir || a.exercise.localeCompare(b.exercise);
    });
    const kg = (v) => (v == null ? '—' : (Math.round(v * 10) / 10).toString());
    const t = $('cut-ex-table');
    t.innerHTML = '<tr>' + cols.map(([k, l]) => `<th data-k="${k}" style="cursor:pointer">${l}${k === sortKey ? (sortDir > 0 ? ' ↑' : ' ↓') : ''}</th>`).join('') + '</tr>' +
      rows.map((r) => `<tr title="${esc(r.coach)}"><td>${esc(r.exercise)}${r.main ? ' <span class="tag Legs" style="color:var(--accent);border-color:var(--accent)">main</span>' : ''}</td><td>${esc(r.day.replace(/^Day /, 'D'))}</td><td>${kg(r.block23_kg)}</td><td>${kg(r.wk1_kg)}</td><td style="color:var(--text)">${kg(r.latest_kg)}</td><td>${kg(r.next_kg)}</td><td>${kg(r.e1rm_latest)}</td>` +
        `<td class="${r.e1rm_change > 0 ? 'up' : r.e1rm_change < 0 ? 'dn' : 'flat'}">${r.e1rm_change == null ? '—' : (r.e1rm_change > 0 ? '+' : '') + (r.e1rm_change * 100).toFixed(1) + '%'}</td></tr>`).join('');
    t.querySelectorAll('th').forEach((th) => th.onclick = () => { const k = th.dataset.k; sortDir = k === sortKey ? -sortDir : (k === 'exercise' || k === 'day' ? 1 : -1); sortKey = k; drawExercises(D); });
  }

  function drawCheckins(D) {
    const rows = D.checkin.filter((r) => r.days > 0);
    $('cut-ci-table').innerHTML = '<tr><th>Cut wk</th><th>Week of</th><th>Phase</th><th>Target lb</th><th>Avg lb</th><th>Δ lb</th><th>Waist cm</th><th>Steps</th><th>Sleep h</th><th>Hunger</th><th>Decision</th></tr>' +
      rows.map((r) => `<tr><td>${r.cut_wk}</td><td>${fmtDate(r.week_of)}</td><td>${esc(r.phase)}</td><td>${f1(r.target_lb)}</td><td style="color:var(--text)">${f1(r.avg_lb)}${r.days < 7 ? ` <span style="opacity:.6">(${r.days}/7)</span>` : ''}</td>` +
        `<td class="${r.delta_lb < 0 ? 'up' : r.delta_lb > 0 ? 'dn' : ''}">${r.days === 7 ? sgn(r.delta_lb) : '—'}</td><td>${f1(r.waist_cm)}</td><td>${r.steps == null ? '—' : Math.round(r.steps).toLocaleString('en-IE')}</td>` +
        `<td>${r.sleep_h ?? '—'}</td><td>${r.hunger ?? '—'}</td><td style="min-width:220px;white-space:normal">${esc(r.decision || '—')}</td></tr>`).join('');
  }

  async function start() {
    try {
      const d = await loadData();
      const D = derive(d);
      render(D, d.live);
      if (d.attempted) $('cut-source').textContent += ' (live sheet unreachable)';
    } catch (e) {
      console.error(e);
      $('cut-load').innerHTML = 'Could not load the Cut to 165 data.';
    }
  }
  document.addEventListener('DOMContentLoaded', start);
})();
