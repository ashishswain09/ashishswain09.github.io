# FORM — conditioning projection

FORM is a private, browser-only prototype for creating a measurable body-conditioning projection and comparing it with a later check-in.

**Live site:** [ashishkumarswain.com/form](https://ashishkumarswain.com/form/)

## Run it

From the root of this repository:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/form/`.

## What the MVP does

- Uploads a baseline photo locally (it is not sent anywhere).
- Records repeatable baseline measurements and lifestyle parameters.
- Builds a time-bound target and flags aggressive weekly weight-change rates.
- Produces an illustrative image transformation based on waist, body-fat, and strength assumptions.
- Compares projected measurements with a dated actual check-in.
- Calculates a transparent match score and plain-language verdict.

## Important product boundary

The photo is not analyzed to infer body fat, health status, or a diagnosis. The visual projection is illustrative and is not a guaranteed outcome. A production version should retain this boundary and add explicit consent, encrypted storage, deletion controls, and professional review of any health-related claims.

## Updating the site

FORM lives in the `form/` folder of the main site repository (`ashishswain09.github.io`). GitHub Pages publishes it with the rest of the site when changes are merged to `main`.
