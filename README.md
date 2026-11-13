# ashishswain09.github.io

Personal website of Ashish Kumar Swain, served by GitHub Pages at **[ashishkumarswain.com](https://ashishkumarswain.com)**.

It's a small collection of personal tools: money, fitness and travel. Every page is a static HTML file with no build step and no server. Personal data stays in the visitor's own browser.

## What's on the site

| Page | Path | What it is |
|---|---|---|
| Home | [`/`](https://ashishkumarswain.com/) | Landing page linking to everything below |
| **Wealth advisor** | [`/advisor.html`](https://ashishkumarswain.com/advisor.html) | Ireland-aware investing plan and AI research partner ([details below](#wealth-advisor)) |
| Travel | [`/travel.html`](https://ashishkumarswain.com/travel.html) | Photographs by country |
| Training | [`/training.html`](https://ashishkumarswain.com/training.html) | 360° fitness dashboard: weight, nutrition and strength tracking |
| FORM | [`/form-conditioning-app/`](https://ashishkumarswain.com/form-conditioning-app/) | Body conditioning projection and progress check-ins (hosted separately, linked from the homepage) |

---

## Wealth advisor

`advisor.html` is a personal investing partner for someone who **lives and pays tax in Ireland**. Its goal is to grow long-term, after-tax wealth. It does two things:

1. **Builds a plan** from your own numbers, using fixed rules and Irish tax law. No AI is involved in this part.
2. **Researches with AI:** you ask questions about portfolios, upcoming IPOs and sector moves, and it searches the web for current data. Each answer gives a euro amount, a rationale and the risks.

### Tabs

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

### Privacy and security

- Your profile, chat history and API keys are stored **only in your browser's localStorage**. Nothing is sent to this website.
- Each API key is sent **only to its own provider**. Keys must **never** be committed to this repository: the repository and site are public, so anyone could copy a committed key.
- Don't save keys on a shared computer. **Settings → Forget this key** removes the key for the selected provider.
- Google may use free-tier Gemini prompts to improve its products, so keep private details out of the chat.

### How it's built

- One self-contained HTML file with inline CSS and JavaScript, and no build step.
- The plan engine, projection, donut chart and line chart are plain JavaScript with hand-drawn SVG.
- **Claude:** the official [`@anthropic-ai/sdk`](https://www.npmjs.com/package/@anthropic-ai/sdk) (pinned to 1.2.0), loaded from jsdelivr only when you send a message. It uses streaming, adaptive thinking, the `web_search` / `web_fetch` server tools, `pause_turn` continuation, and server-side refusal fallbacks.
- **Gemini:** the REST `streamGenerateContent` endpoint with the `google_search` tool.
- **OpenRouter:** the OpenAI-compatible `chat/completions` streaming endpoint, with an optional `web` plugin.
- Answers are rendered with [marked](https://marked.js.org/) and sanitised with [DOMPurify](https://github.com/cure53/DOMPurify). If either fails to load, the page falls back to escaped plain text.

### Disclaimer

The advisor provides **educational analysis, not regulated financial advice**. It is not a Central Bank of Ireland–authorised adviser and can be wrong. Investments can fall in value. For pensions, large sums, or anything you don't fully understand, speak to a CBI-authorised financial adviser.

---

## Running locally

No build is needed. Serve the folder and open it in a browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

GitHub Pages publishes the `main` branch. `CNAME` points the site at `ashishkumarswain.com`. Changes go live a minute or two after merging to `main`.
