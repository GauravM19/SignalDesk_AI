# SignalDesk UI improvement tracker

Requested window: 24 November–3 December 2026. Target: two meaningful changes per day.
Each change must be verified; existing functionality and inapplicable items will not
be repackaged as fake fixes just to reach twenty commits.

| Item | Status |
| --- | --- |
| Remove horizontal scrolling | Layout shrink/wrap rules implemented; production build passed. Browser viewport verification remains pending. |
| Find broken links | Production-page audit checked 16 internal links across landing/dashboard; none broken. Audit now runs in CI. |
| Mobile menu | Pending |
| Favicon | Pending |
| Page titles | Pending route-specific review |
| Meta descriptions | Pending route-specific review |
| Footer links | Pending; current footer contains text, not broken links |
| Custom 404 | Pending |
| Copyright year | Pending dynamic year |
| Compressed images | Conditional; current pages have no content images to compress |
| Broken buttons | Pending interaction audit |
| Success messages | Pending review and improvements |
| Error messages | Pending frontend error-state review |
| Placeholder text | Pending removal of misleading demo claims |
| Unused navigation | Pending review |
| Mobile overflow | Pending viewport regression checks beyond the initial layout fix |
| Clickable logo | Already links home on both pages; verify rather than duplicate |
| Clickable phone | Needs a real approved contact number; do not invent one |
| Clickable email | Needs a real approved public contact address; do not invent one |
| All-page mobile optimisation | Pending final viewport/accessibility pass |

## Repeat the link audit

From `frontend/`:

```sh
npm ci
npm run build
npm run test:links
```

The audit starts a temporary local production server, fetches the rendered pages,
and checks anchor destinations and fragment IDs. It also tests known broken fixtures
so the detector itself cannot silently pass. External websites are not crawled;
JavaScript-generated navigation must be covered separately by interaction testing.

## Verification limits

On 24 November the managed preview launcher passed Vite-only flags to Next.js and
failed to start. No mobile browser screenshots or viewport measurements are claimed.
The production build and local HTTP link audit passed. GitHub Actions is the source
of truth for remote CI status; this checklist is not a deployment confirmation.
