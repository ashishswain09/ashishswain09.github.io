// FORM body-composition model.
//
// Built on published, clinically used equations:
//  • Resting energy: Mifflin-St Jeor (1990), recalculated each day as weight changes.
//  • Weight change: the energy-balance approach of Hall et al. (Lancet 2011, the model behind
//    the NIH Body Weight Planner): daily energy imbalance is stored or released as fat and
//    lean tissue, split by Forbes' body-composition curve p = C / (C + fat mass), C = 10.4 kg,
//    with energy densities of 9,440 kcal/kg (fat) and 1,816 kcal/kg (lean), and adaptive
//    thermogenesis (β = 0.24 of the intake change) that slows loss over time.
//  • Body fat ↔ waist: the US Navy circumference equations (Hodgdon & Beckett 1984), anchored to
//    the person's own measurements so only the change is modelled.
// Two smaller adjustments come from controlled trials and are less certain: resistance training
// protects lean mass during a deficit, and sleep under 7 h shifts more of the loss to lean mass
// (Nedeltcheva et al. 2010). Glycogen/water swings in the first 1–2 weeks are not modelled.
(function (global) {
  const RHO_F = 9440, RHO_L = 1816, FORBES_C = 10.4, BETA = 0.24;

  function mifflin(sex, w, h, age) { return 10 * w + 6.25 * h - 5 * age + (sex === "female" ? -161 : 5); }

  function pal(steps, sessions) {
    return Math.max(1.3, Math.min(2.1, 1.25 + 0.2 * Math.min(steps, 20000) / 10000 + 0.04 * Math.min(sessions, 7)));
  }

  // US Navy body fat %. Male: waist & neck. Female: waist, hip & neck.
  function navyBF(sex, h, waist, neck, hip) {
    if (sex === "female") {
      if (!hip || waist + hip - neck <= 0) return null;
      return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(h)) - 450;
    }
    if (waist - neck <= 0) return null;
    return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
  }
  // Deurenberg (1991) BMI-based estimate, used only when no body fat or neck is given.
  function deurenbergBF(sex, w, h, age) {
    const bmi = w / (h / 100) ** 2;
    return 1.2 * bmi + 0.23 * age - 10.8 * (sex === "female" ? 0 : 1) - 5.4;
  }

  // Waist for a given body-fat change, from the Navy equation anchored at the start measurements.
  function waistFor(start, bfNow) {
    const { sex, waist, neck, hip } = start;
    const navy0 = start.navyBF0;                       // Navy-equation BF at the start measurements
    const bfNavy = navy0 + (bfNow - start.bf0);         // apply the modelled change on the Navy scale
    const k = sex === "female" ? 0.35004 : 0.19077;
    const shift = (495 / (navy0 + 450) - 495 / (bfNavy + 450)) / k;   // Δ log10 of the Navy girth term
    if (sex === "female") {
      const s0 = waist + hip - neck, s1 = s0 * 10 ** shift;
      const r = (s1 + neck) / (s0 + neck);              // waist and hip shrink in proportion
      return { waist: waist * r, hip: hip * r };
    }
    return { waist: neck + (waist - neck) * 10 ** shift, hip: hip };
  }

  function start(inp) {
    const { sex, age, height: h, weight: w, waist } = inp;
    const neckGiven = inp.neck > 0;
    const neck = neckGiven ? inp.neck : (sex === "female" ? 33 : 38);
    const hip = inp.hip > 0 ? inp.hip : (sex === "female" ? waist * 1.25 : 0);
    const navy = navyBF(sex, h, waist, neck, hip);
    let bf0 = inp.bodyfat > 0 ? inp.bodyfat : null, bfSource = "measured";
    if (bf0 == null && neckGiven && navy != null) { bf0 = navy; bfSource = "US Navy tape method"; }
    if (bf0 == null) { bf0 = deurenbergBF(sex, w, h, age); bfSource = "estimated from BMI (add neck for better)"; }
    bf0 = Math.max(4, Math.min(55, bf0));
    const navyBF0 = navy != null ? Math.max(3, navy) : bf0;
    const p = pal(inp.steps, inp.training);
    const maintenance = p * mifflin(sex, w, h, age);
    return { sex, age, h, w, waist, neck, hip, neckGiven, bf0, bfSource, navyBF0,
             F0: w * bf0 / 100, L0: w * (1 - bf0 / 100), pal: p, maintenance };
  }

  // Simulate `days` at a planned intake change `dI` (kcal/day vs maintenance), of which only
  // `adherence` (0..1) is actually achieved. Returns one point per day.
  function simulate(s, dI, days, opts) {
    const adherence = opts.adherence ?? 1;
    const train = Math.max(0, Math.min(1, (opts.training || 0) / 3)) * (opts.trainingConsistency ?? 1);
    const sleepPenalty = Math.max(0, Math.min(1, (7 - (opts.sleep ?? 7)) / 2));     // 0 at ≥7 h, 1 at ≤5 h
    const eff = dI * adherence;
    let F = s.F0, L = s.L0;
    const out = [{ day: 0, w: F + L, F, L, bf: 100 * F / (F + L) }];
    for (let d = 1; d <= days; d++) {
      const W = F + L;
      const E = s.pal * mifflin(s.sex, W, s.h, s.age) + BETA * eff;
      const imbalance = s.maintenance + eff - E;
      let p = FORBES_C / (FORBES_C + F);
      if (imbalance < 0) p *= (1 - 0.45 * train) * (1 + 0.6 * sleepPenalty);           // deficit: training spares lean, short sleep costs lean
      else p = Math.min(0.85, p * (1 + 0.8 * train));                                // surplus: training directs more to lean
      p = Math.max(0.03, Math.min(0.9, p));
      // p is the share of the *mass* change that is lean; convert the energy imbalance to mass.
      const dM = imbalance / (p * RHO_L + (1 - p) * RHO_F);
      F += (1 - p) * dM;
      L += p * dM;
      F = Math.max(0.5, F);
      out.push({ day: d, w: F + L, F, L, bf: 100 * F / (F + L) });
    }
    return out;
  }

  // Intake change needed to reach `targetW` in `days` at full adherence (bisection).
  function requiredIntake(s, targetW, days, opts) {
    let lo = -2500, hi = 2000;
    for (let i = 0; i < 50; i++) {
      const mid = (lo + hi) / 2, w = simulate(s, mid, days, { ...opts, adherence: 1 }).at(-1).w;
      if (w > targetW) hi = mid; else lo = mid;
    }
    return (lo + hi) / 2;
  }

  function project(inp) {
    const s = start(inp);
    const days = Math.max(7, Math.round(inp.weeks * 7));
    const opts = { training: inp.training, trainingConsistency: inp.trainingConsistency, sleep: inp.sleep };
    const dI = requiredIntake(s, inp.targetWeight, days, opts);
    const floor = Math.max(s.sex === "female" ? 1200 : 1500, 0.8 * mifflin(s.sex, s.w, s.h, s.age));
    const intake = s.maintenance + dI;
    const plan = simulate(s, dI, days, { ...opts, adherence: 1 });
    const likely = simulate(s, dI, days, { ...opts, adherence: inp.nutritionConsistency });
    const low = simulate(s, dI - 150, days, { ...opts, adherence: inp.nutritionConsistency });   // ±150 kcal/day: typical
    const high = simulate(s, dI + 150, days, { ...opts, adherence: inp.nutritionConsistency });  // intake-tracking error
    const withWaist = (pt) => ({ ...pt, ...waistFor(s, pt.bf) });
    return {
      start: s, days, dI, intake, floor, belowFloor: dI < 0 && intake < floor,
      plan: plan.map(withWaist), likely: likely.map(withWaist), low, high,
    };
  }

  global.FormModel = { project, navyBF, mifflin, pal, start };
})(window);
