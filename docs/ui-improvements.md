# SignalDesk UI improvement tracker

Requested window: 24 November–3 December 2026. Target: two meaningful changes per day.
Each change must be verified; existing functionality and inapplicable items will not
be repackaged as fake fixes just to reach twenty commits.

| Item | Status |
| --- | --- |
| Remove horizontal scrolling | Layout shrink/wrap rules implemented; production build passed. Browser viewport verification remains pending. |
| Find broken links | Production-page audit checked 27 internal links across landing/dashboard after adding footer navigation; none broken. Audit runs in CI. |
| Mobile menu | Implemented on landing page with native disclosure, keyboard support, Escape dismissal, close-on-selection and 44px+ targets. Production HTML contract checked; browser interaction QA pending. |
| Favicon | Added lightweight branded SVG using Next.js icon discovery. Production HTTP test verifies both pages advertise it and the asset is served as SVG below 1 KB. |
| Page titles | Landing and dashboard now have distinct server-rendered titles with shared brand templating; production HTML tests prevent missing or duplicate titles. |
| Meta descriptions | Landing and dashboard now have distinct descriptions that describe current prototype functionality; exact production HTML checked. |
| Footer links | Shared landing/dashboard footer provides Home, Workspace, How it works and the real source repository; internal destinations verified by production link audit. |
| Custom 404 | Branded, responsive recovery page links to home/workspace. Production tests assert HTTP 404, noindex and all three recovery links on unknown top-level and nested URLs. Browser visual QA pending. |
| Copyright year | Footer derives the UTC year from the clock, refreshes after hydration and hourly for long-open sessions; production HTML checked against the current year. |
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
