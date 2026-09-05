# Homepage

The homepage identifies Manuel Muñoz Solera, lists the ten most recent journal entries, links out to notes, and shows a WebGL cartridge stack above the identity heading.

## Sub-features

- `home-identity` shows the site name in the header and the identity heading in the main column.
- `home-journal` lists recent notes as links into `/note/<slug>` and offers `View more →`.
- `home-nav` reaches Notes and Photos from the header.
- `home-cartridges` shows the cartridge canvas on `/` only.

## How to get to it (user POV)

- Open `/`.
- Choose the `mamuso` header link from any other route.

## Driving it with control-mamuso

Preconditions:

- mamuso.dev is healthy at `$BASE` (`control-mamuso doctor` prints that URL).
- Browser tools target `$BASE`, not production.

- **Direct URL.** Open the homepage. Navigate to `$BASE/`. The header link `mamuso` is present, a heading reads `Manuel Muñoz Solera`, and a heading `Journal` precedes a list of note links.
- **Header home.** From Notes, return home. Click the `notes` link, then click `mamuso`. The identity heading `Manuel Muñoz Solera` is visible again and the path is `/`.
- **Journal list.** In the `Journal` section, the first items are links whose names end with an em dash and a date (`<title> — <date>`). At least one link is present. The `View more →` link is present.
- **Open a recent note.** Choose the `Cozy` journal link if listed; otherwise choose the first journal link and record its accessible name. The resulting page is an `article` whose heading matches the title you clicked.
- **Header notes/pics.** From `/`, click `notes`. Heading `Journal` and `Expand all notes ↓` appear. Click `mamuso`, then click `pics`. Heading `Say Cheese` appears.
- **Cartridge canvas.** On `/`, take a screenshot of the area between the header and `Manuel Muñoz Solera`. A cartridge stack is visible (not a blank band). There is no accessible cartridge control to click; do not fail the feature for missing keyboard equivalents. Open `/notes` and confirm that canvas is absent.
- **Proof.** Save an ARIA snapshot and screenshot. Run a snapshot to `.cursor/skills/verify-mamuso-dev/artifacts/homepage/home.aria.txt` and a screenshot to `.cursor/skills/verify-mamuso-dev/artifacts/homepage/home.png`. Both identify `mamuso` and `Manuel Muñoz Solera`.

## Gotchas

- The cartridge stage is imported only by `app/page.tsx`. Notes and photos must not show it. Homepage proof still needs the identity heading, which those routes do not have.
- Cartridge interaction is canvas-only. Hover labels currently read `Company` / `0000 - 0000` and are not a career-archive proof.
- Journal dates come from `Date` plus `toLocaleDateString('en-us')`. Do not assert the calendar day in the filename; assert the title.
- Homepage and `/notes` read posts at module load. After adding Markdown, restart the verification server before proving the new entry is listed.
- `View more →` goes to `/notes` (no trailing slash in the href). The header `notes` link goes to `/notes/`. Treat both as the archive.
- In `pnpm dev`, a Next.js hydration overlay (date formatting in the user locale) can sit on top of the page and swallow the first click. Dismiss `Collapse issues badge` or `Open issues overlay`, then retry the intended control. Do not treat the overlay as part of the product.
- `browser_take_screenshot` may time out on this page because of the WebGL canvas. Keep the ARIA snapshot and HTML body; retry the screenshot once, then continue.
