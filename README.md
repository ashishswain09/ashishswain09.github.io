# ashishswain09.github.io

Personal website of Ashish Kumar Swain, served by GitHub Pages at **[ashishkumarswain.com](https://ashishkumarswain.com)**.

It's a small collection of personal tools: money, fitness and travel. Every page is static HTML with no build step and no server, and every page shares one look: a dark background, a gold accent, Cormorant Garamond headings and Inter body text.

## What's on the site

| Page | Path | In one line |
|---|---|---|
| Home | [`/`](https://ashishkumarswain.com/) | Landing page: a statement headline, a tile for each page, and About |
| Wealth advisor | [`/advisor.html`](https://ashishkumarswain.com/advisor.html) | Ireland-aware investing plan and AI research partner |
| Training | [`/training.html`](https://ashishkumarswain.com/training.html) | Cut to 165: weight, waist, body fat and strength against the plan |
| FORM | [`/form/`](https://ashishkumarswain.com/form/) | Body-conditioning projection and photo check-ins, all in the browser |
| Travel | [`/travel.html`](https://ashishkumarswain.com/travel.html) | Photographs by country, loaded from Google Drive |

## Pages in detail

Click a page to expand it.

<details>
<summary><b>🏠 Home</b>: the landing page</summary>

<br>

`index.html` is a minimal, Apple-inspired landing page: lots of space, large type and one clear path to each page.

| Part | What it shows |
|---|---|
| Top bar | An "A." monogram, with links to Explore, About and LinkedIn |
| Hero | "Limerick, Ireland", the name in large Cormorant Garamond with the gold full stop over a soft gold glow, and one line: *Building digital banking by day. Investing, training and travelling the rest of the time, and measuring all of it.* |
| Explore | Four rounded tiles, one per page, each with a kicker, title, one-line description and a small SVG drawing: a growth curve for the **Wealth advisor**, a weight line stepping down towards the plan for **Cut to 165**, a progress ring for **Form** and stacked photos for **Travel**. On hover a tile lifts and its border turns gold. |
| About | The intro as a large quote, then three facts: Now (digital banking at Permanent TSB), Based (Limerick, since 2021), Outside work (markets, lifting, photography) |
| Footer | Copyright, "Originally from India" and LinkedIn |

How it behaves:

- **Layout:** tiles sit 4 + 2 and 3 + 3 on desktop and in one column on phones, where each drawing shrinks below its text. Every section shares the same edges.
- **Motion:** sections fade up as they scroll into view. Nothing animates if the device asks for reduced motion, and all content shows without JavaScript.
- **Code:** one self-contained HTML file with inline CSS, SVG and a few lines of JavaScript. There's no tracking.
- **Adding a page:** copy one of the `<a class="tile">` blocks and pick `wide`, `narrow` or `half` so each row adds up to 6 columns.

</details>

<details>
<summary><b>💰 Wealth advisor</b>: investing plan and AI research for an Irish resident</summary>

<br>

`advisor.html` is a personal investing partner for someone who **lives and pays tax in Ireland**. Its goal is to grow long-term, after-tax wealth. It does two things:

1. **Builds a plan** from your own numbers, using fixed rules and Irish tax law. No AI is involved in this part.
2. **Researches with AI:** you ask questions about portfolios, upcoming IPOs and sector moves, and it searches the web for current data. Each answer gives a euro amount, a rationale and the risks.

#### Tabs

**1 · Profile**
Age, salary, take-home pay, spending, cash, existing investments and pension, employer pension match, expensive debt, the amount you can invest each month, any lump sum, time horizon and goals. You also pick a **risk level from 1 to 5**, based on how you'd react to a 30% market fall.

**2 · Plan**
- A **priority ladder** showing where each month's money should go, with a euro amount and a reason for every step, ordered by the most certain return first:
  1. Emergency fund: 4–6 months of spending, held in an instant-access account or An Post State Savings.
  2. Pay off debt above 7% APR.
  3. Pension contributions up to the full employer match.
  4. Extra pension contributions (an AVC or PRSA) if you pay tax at 40%, up to your age-based relief limit.
  5. Invest whatever is left.
- An **investment mix** for your risk level, using a core + satellite approach:

  | Sleeve | What goes in it | Tax treatment |
  |---|---|---|
  | Core | Global equity UCITS ETF (e.g. VWCE, SSAC) | Exit tax |
  | Investment trusts | London-listed global trusts (e.g. F&C, Alliance Witan) | CGT, no deemed disposal |
  | Bonds | Euro government bonds or bond ETF | Exit tax if held via an ETF |
  | State Savings | An Post Savings Bonds/Certs | Tax-free |
  | Satellite | Single stocks, IPOs, sector themes, capped at 2% per IPO and 5% per stock | CGT |

  The share of each sleeve depends on the risk level: Conservative → Cautious → Balanced → Growth → Aggressive.
- An **after-tax projection** chart for poor, expected and strong markets. It includes exit tax with 8-yearly deemed disposal on ETFs, and capital gains tax with the annual exemption on trusts and shares.

**3 · Ask advisor**
A chat that knows your profile, your plan and Irish tax rules. It's instructed to:
- give concrete actions: what to buy, how much in euro and as a % of your money, the ticker and exchange, and when
- explain why now, the bear case, and when to exit or review
- show the after-tax effect for an Irish resident
- treat IPOs and single stocks as speculative, keep position sizes small, and say plainly when something is overhyped or when "keep buying the core ETF" is the best answer
- cite its sources when it uses live web search
- if the chosen provider has no web access, avoid presenting prices or dates as current, and say what to check instead

There are one-click prompts for common questions: this month's money, IPOs to watch, sector outlook, building a portfolio, tax-efficient vehicles, and a recession stress test.

**Irish tax rules**
An editable table that drives both the plan and the advisor:

| Rule | Value |
|---|---|
| Exit tax on Irish/EU funds and ETFs | 38% from 1 Jan 2026 (was 41%) |
| Deemed disposal | Every 8 years |
| Capital gains tax | 33%, first €1,270 of gains each year tax-free |
| DIRT on deposit interest | 33% |
| Higher-rate band (single) | €44,000 |
| Pension relief earnings cap | €115,000 |
| Pension relief by age | <30: 15% · 30–39: 20% · 40–49: 25% · 50–54: 30% · 55–59: 35% · 60+: 40% |

The table also covers dividend taxation (the W-8BEN form for 15% US withholding) and auto-enrolment (MyFutureFund). **Check revenue.ie after each October Budget** and update any value that has changed.

**Settings: choose the AI provider**

| Provider | Cost | Live web data | Key from |
|---|---|---|---|
| Google Gemini (default) | Free tier, with daily limits | Yes, Google Search grounding | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| OpenRouter | Free `:free` models | Optional, uses paid credit | [openrouter.ai/keys](https://openrouter.ai/keys) |
| Anthropic Claude (Opus 5.5 / Sonnet 5.5) | Paid | Yes, web search and page reading | [console.anthropic.com](https://console.anthropic.com) |

"Load models" fetches each provider's current model list.

#### Privacy and security

- Your profile, chat history and API keys are stored **only in your browser's localStorage**. Nothing is sent to this website.
- Each API key is sent **only to its own provider**. Keys must **never** be committed to this repository: the repository and site are public, so anyone could copy a committed key.
- Don't save keys on a shared computer. **Settings → Forget this key** removes the key for the selected provider.
- Google may use free-tier Gemini prompts to improve its products, so keep private details out of the chat.

#### How it's built

- One self-contained HTML file with inline CSS and JavaScript, and no build step.
- The plan engine, projection, donut chart and line chart are plain JavaScript with hand-drawn SVG.
- **Claude:** the official [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk) (pinned to 1.2.0), loaded from jsdelivr only when you send a message. It uses streaming, adaptive thinking, the `web_search` / `web_fetch` server tools, `pause_turn` continuation, and server-side refusal fallbacks.
- **Gemini:** the REST `streamGenerateContent` endpoint with the `google_search` tool.
- **OpenRouter:** the OpenAI-compatible `chat/completions` streaming endpoint, with an optional `web` plugin.
- Answers are rendered with [marked](https://marked.js.org/) and sanitised with [DOMPurify](https://github.com/cure53/DOMPurify). If either fails to load, the page falls back to escaped plain text.

#### Disclaimer

The advisor provides **educational analysis, not regulated financial advice**. It is not a Central Bank of Ireland–authorised adviser and can be wrong. Investments can fall in value. For pensions, large sums, or anything you don't fully understand, speak to a CBI-authorised financial adviser.

</details>

<details>
<summary><b>🏋️ Training</b>: Cut to 165, Block 1</summary>

<br>

`training.html` tracks one goal: **cutting from 184.5 lb to 165 lb by 7 Feb 2027** while keeping strength. All new data goes on top of this plan. The older Pete coaching history was removed so it doesn't add noise.

#### What the page shows

| Section | What it tells you |
|---|---|
| Headline | Last full week's 7-day average, total lost, distance from plan, and how many main lifts are stronger than Block 1 week 1 |
| Tiles | 7-day average · lost since 14 Sep and lb to go · waist at navel · 3-week loss rate · main lifts stronger · US Navy body fat |
| This week's call | The check-in sheet's decision for the coming week (e.g. "drop ONE ladder step") |
| Weight vs plan | Daily weigh-ins (dots), each full week's 7-day average (gold line), the plan's weekly targets (dashed) and the 165 goal |
| Waist | Waist at the navel, measured each Sunday |
| Weekly loss vs 1 lb trigger | Week-on-week change in the 7-day average. Green bars beat 1 lb/week; under it for 3 weeks means stepping the diet down one rung |
| Body fat | Three tape-measure estimates (US Navy, YMCA, RFM) with the 15% "start a surplus" line, plus fat vs lean mass and a week-by-week table |
| Strength | % change in estimated 1-rep max (e1RM) for each main lift since Block 1 week 1 |
| Every exercise | Block 23 load, week 1 load, latest and next prescribed load, e1RM and its change. Sortable; hover a row for the coach note |
| Weekly check-ins | Target vs actual, steps, sleep, hunger and each week's decision |

#### How the numbers are worked out

- **Body fat:** height 170.2 cm and neck 38 cm are fixed.
  - US Navy = `495 / (1.0324 − 0.19077·log10(waist − neck) + 0.15456·log10(height)) − 450`
  - YMCA = `(−98.42 + 4.15·waist_in − 0.082·weight_lb) / weight_lb`
  - RFM = `64 − 20·(height / waist)`
- **Fat and lean mass:** weekly average weight × US Navy %.
- **Headline and tiles:** these use the last *full* week (7 weigh-ins). A week in progress is shown separately, because part weeks swing with water.

#### Where the data comes from

The page reads your **Block 1 workbook live** from Google Sheets each time it opens. This is the same workbook you log in, so new weigh-ins, check-ins and sessions show up automatically.

- **Sheet:** set in `CUT165_SHEET_ID` in `training-cut165.js`. It's shared "Anyone with the link → Viewer".
- **Tabs read:**
  - **Check-in:** one row per cut week, with the target, Mon–Sun weigh-ins, 7-day average, weekly change, 3-week rate, waist, steps, sleep, hunger and decision.
  - **Log:** one row per exercise per block week, with load, reps, RIR, e1RM, next load, the Block 23 load and the coach note. Warm-up rows and unlogged sets are skipped.
- **Columns are read by position.** If you insert or move a column in either tab, update the indexes in `fromWorkbook()`. If the layout stops making sense, the page falls back rather than showing wrong numbers.
- **Fallback:** if the sheet can't be reached, the page uses the saved copy in `data/cut165/` (currently up to 13 Nov), and the header pill shows its date instead of **Live data**.

Anything on this page is public, so weight, waist and body-fat figures can be seen by anyone who visits.

</details>

<details>
<summary><b>📸 FORM</b>: conditioning projection and check-ins</summary>

<br>

**Live at [ashishkumarswain.com/form](https://ashishkumarswain.com/form/).** The old address, `/form-conditioning-app/`, forwards here automatically.

`form/` is a browser-only prototype for setting a measurable body-conditioning target and comparing it with a later check-in. Photos never leave the device.

It has three steps:

1. **Baseline:** add a front-facing photo (JPG, PNG, or iPhone HEIC, which is converted in the browser) and record date, sex, age, height, weight, waist, neck (hip for women), optional measured body fat, sleep, steps and training days. Then **tap your waist** on the photo and set the **body width** markers, so FORM knows where your body is in the picture.
2. **Projection:** set a target weight and timeline. A **validated body-composition model** (`form/model.js`) works out the rest:
   - **resting energy:** Mifflin-St Jeor, scaled by an activity level from your steps and training
   - **day-by-day weight change:** the Hall energy-balance model (the basis of the NIH Body Weight Planner), with Forbes' fat/lean split, adaptive slowdown, and trial-based adjustments for strength training (protects muscle) and short sleep (costs muscle)
   - **body fat and waist:** the US Navy circumference equations, anchored to your own measurements

   It shows the daily calories needed, the **likely** result at your stated consistency (with a ±150 kcal/day range), how much of the change is fat vs lean, a plan-vs-likely chart, and the **predicted waist and body fat**. It flags targets that would need an unsafe intake. The photo is then reshaped to the likely outcome. Only your body changes:
   - the waist follows the predicted waist
   - overall width scales with weight
   - the shoulders widen slightly with strength
   - a body-fat drop adds a touch of definition

   The background stays exactly as it was.
3. **Check-in:** on any later date, add a new photo and your actual numbers. FORM shows **start, projection and actual** side by side. The projection is drawn for *that* date, so 6 weeks into a 12-week plan shows the halfway point. You also get:
   - a swipe slider to compare *projected vs actual* or *start vs actual*
   - a variance table (start, expected, actual, vs plan, since start)
   - a match score and verdict

Your photos, numbers, targets and last check-in are **saved in this browser** (localStorage), so they're still there on check-in day. **Start a new baseline** deletes them.

The numbers come from validated equations, but they're population averages: individual results vary (typically ±1–2 kg over 12 weeks, and ±3–4% for tape-measured body fat). The photo is never analysed to infer body fat or health, and the reshaped image is an illustration of the predicted numbers, not a medical prediction of appearance. Not medical advice.

Files: `index.html`, `app.js` (page logic), `model.js` (the body-composition model), `styles.css`, with its own [README](form/README.md) and MIT [LICENSE](form/LICENSE). The forwarding page for the old address is `form-conditioning-app/index.html`.

</details>

<details>
<summary><b>✈️ Travel</b>: photographs by country</summary>

<br>

`travel.html` is a visual journal of places visited, organised by country.

- **Photos:** loaded live from a **Travel** folder in Google Drive through the Google Drive API. Each sub-folder is a country, so adding photos to Drive updates the page with no code change.
- **Browsing:** a filter bar switches between *All* and each country (with its flag). A lightbox opens any photo full-size, with previous/next arrows.
- **Setup** (in the `CONFIG` block at the top of the file): a Google API key with the Drive API enabled, and the Travel folder's ID. The folder must be shared "Anyone with the link can view". The key should be restricted to `ashishkumarswain.com` in Google Cloud, because it sits in public code.

</details>

---

## Running locally

No build is needed. Serve the folder and open it in a browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

GitHub Pages publishes the `main` branch. `CNAME` points the site at `ashishkumarswain.com`. Changes go live a minute or two after merging to `main`.
