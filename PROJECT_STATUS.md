# MK PDF: project status

_Source of truth for this app's claude.ai chat. As of 2026-11-27._

View, edit (real text and images, including scans), sign, organize and convert PDFs.

## Current state

| | |
|---|---|
| Version | **1.3.17** (2026-11-18: store editions, draft recovery, About and licences, privacy policy) |
| Platforms | Mac (native SwiftUI), Windows (Electron, installer + portable), Android (Capacitor APK), iPhone/iPad (unsigned IPA, sideload) |
| Downloads | GitHub releases in this repo (`v1.3.17`), built by `release.yml` on a `v*` tag |
| Website | **https://mkpdf.pages.dev** (`docs/`, auto-deploys via `pages.yml` to Pages project `mkpdf`) |
| App Store / Play | Not live (store edition files exist: `STORE.md`, `MKPDF-AppStore.entitlements`) |
| In-app updates | Every copy checks GitHub Releases at launch, hourly and on focus |

## Recent changes

- 2026-11-26: Landing page with live download links for every platform, redesigned; auto-deploy (PR #2); koussa.net invite (PR #3); SEO/share previews, 1200x630 share image (PR #4); recon notes (PR #1).

## Open items

- `ci.yml` (runs on every push to main) had one existing failing app test on 2026-11-26, unrelated to the site.
- README install links point at `mohamdbeam-star/MK-PDF`; switch to `Mkuz1/MK-PDF`.

## Rules for every MK app (decided in the MK APPS project)

- **This file is the hand-off to the app's own Claude chat.** That chat reads it from GitHub through Project knowledge. Every change to this app (code, release, store, website, decision) must also update this file in the same PR or commit.
- **Nothing local-only.** Every asset, store file and site file lives in the app's GitHub repo. Signing keys and passwords are the only exception and are never committed (they stay in `~/keys` on the Mac).
- **Websites deploy themselves** to Cloudflare Pages from GitHub Actions on push (secrets `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` are set on the repo). No manual or terminal deploys.
- **Every app site invites visitors to https://www.koussa.net** (the MK Apps showcase, source in `Mkuz1/MK-APPS`, served by Cloudflare project `mkuzapps`). Keep that card when editing the site, and update the app's row in `MK-APPS/build.py` when platforms, versions or store links change.
- **SEO and share previews (done 2026-11-26):** keep the OG + Twitter tags with an absolute 1200x630 image under 300 KB, canonical, favicon.ico + 192/512 icons + 180 px touch icon, web manifest, robots.txt, sitemap.xml and SoftwareApplication JSON-LD. When replacing a share image, give it a new file name so WhatsApp refreshes its cache.
- **Store badges only for what is really live.** Re-check the App Store / Play page before adding a badge.
- **Mohamad merges pull requests himself** (Claude Code's auto mode on the Mac blocks `gh pr merge`).

---
_Last updated 2026-11-27. Update this file with every change to the app._
