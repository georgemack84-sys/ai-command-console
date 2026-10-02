# Nuru Discover — Product Specification

## 1. Purpose

Nuru Discover is the reader-facing exploration layer built on governed Nuru
knowledge. It helps a signed-in user find useful, surprising, and explainable
material without making unsupported claims or obscuring why an item appeared.

Nuru V1 remains the authority system. Discover only presents catalog-eligible
knowledge and records user feedback.

## 2. Primary user flow

```text
Open Discover
  → receive today’s bounded session of seven items
  → inspect featured discovery and “Why this?” rationale
  → Explore, Save, or Not for me
  → begin or continue an exploration path
  → inspect/correct signals in Taste Map
```

The feed is finite by design. It should invite attention, not mimic an endless
algorithmic stream.

## 3. Information architecture

| Route | Purpose | Primary actions |
| --- | --- | --- |
| `/nuru/discover` | Daily discovery session | Explore, Save, Not for me, start a path |
| `/nuru/discover/[id]` | Item detail and evidence | Read source, inspect rationale, save, path entry |
| `/nuru/saved` | Deliberately saved discoveries | Revisit, remove, start path |
| `/nuru/rabbit-holes` | User-owned exploration paths | Begin, continue, end, inspect next-step rationale |
| `/nuru/taste-map` | Transparent interest profile | Inspect signals, correct, delete, reset a topic |

Existing `/nuru/dashboard`, `/nuru/review`, `/nuru/operations`, Explorer, and
Relationship View remain governor/operator surfaces, not user discovery UI.

## 4. Discover page contract

### Header

- Brand: `NURU` with “A deeper world” subline.
- Primary navigation: Discover, Rabbit Holes, Saved, Taste Map.
- Search opens catalog search—not unrestricted web search.
- Profile menu includes personalization controls and sign-out.

### Hero

```text
GOOD MORNING
I found 7 things for you.
3 strong matches · 2 adjacent · 1 serendipity · 1 wildcard
```

- Background: one atmospheric, licensed image with an accessible non-image
  fallback.
- The numbers must derive from the actual session lanes.
- Session date and ranking version are available from the page’s details panel,
  never presented as decorative fiction.

### Featured discovery

Required content:

- title, type, creator/source, approximate date if known
- 1–2 sentence catalog summary
- image or fallback treatment
- Explore, Save, and Not for me actions
- match percentage only when the score is calibrated and available
- `Why Nuru chose this` panel

Required `Why this?` fields:

```text
Why Nuru chose this
• [reason code, expressed in plain language]
• [supporting topic or saved item]
• Source: [verified / source detail]
• Confidence: [band or calibrated percentage]
• View evidence →
```

### Discovery lanes

Each session exposes exactly these labeled lanes:

| Lane | Selection rule | User-facing explanation |
| --- | --- | --- |
| Near certain match | Strong explicit-interest affinity | “Closely matches what you’ve told Nuru you enjoy.” |
| Adjacent | Graph/topic proximity with lower direct affinity | “Connects to an interest through a neighboring idea.” |
| Serendipity | Controlled diversity with evidence threshold | “A considered detour beyond your usual path.” |
| Wildcard | Highest novelty within quality policy | “An unexpected idea selected for a possible new direction.” |

Every card shows title, image/fallback, item type, primary topic, short premise,
lane badge, and a one-action save control. Hover/focus reveals a compact Why this
summary; mobile uses an explicit details control.

### Curiosity actions

```text
Surprise Me       → select a policy-safe wildcard
Rabbit Hole       → create an exploration path from a seed item
Go Deeper         → retrieve stronger related material for a selected interest
Somewhere New     → diversify away from recent high-frequency topics
```

Actions may propose a new session or path, but must not silently alter profile
signals until the user engages with returned material.

### Taste insight

The insight panel appears only with a recorded, explainable trend.

```text
NURU NOTICED SOMETHING
Your interest in aviation appears to be shifting.

[Explore this] [Not really]
```

“Not really” suppresses the proposed inference and records a corrective signal.

## 5. Visual system

| Element | Direction |
| --- | --- |
| Surface | Midnight black to deep navy; subtle radial depth, never glassy neon |
| Typography | Editorial serif for display hierarchy; crisp sans/mono for metadata |
| Accent | Muted antique gold for actions, dividers, and selected states |
| Semantic color | Calm green only for verified/healthy state; amber for caution; red reserved for material errors |
| Imagery | Cinematic, quiet, wide-format; no stock-photo collage feel |
| Density | Spacious desktop grid; no endless lists; each surface has a clear focal task |
| Motion | 150–220ms understated transitions; respect reduced motion |

The reference is an aesthetic target, not an asset source. Do not reuse its
imagery, copy, or brand elements.

## 6. Responsive behavior

### Desktop (>= 1200px)

- Featured discovery in a 2:1 editorial card.
- Four discovery lanes in one row.
- Curiosity actions and Taste insight form a two-column lower section.

### Tablet (768–1199px)

- Featured card stacks media and rationale under 900px.
- Discovery cards display two columns.
- Curiosity actions stay a two-by-two grid.

### Mobile (< 768px)

- Single-column feed.
- Hero keeps headline and lane count; atmospheric image becomes shallow.
- Featured actions remain visible; rationale opens in a disclosure panel.
- Nav collapses into an accessible menu.
- Minimum tap target: 44px.

## 7. State inventory

Every screen must render and test these states:

- first session / no interest signals
- normal populated session
- no eligible catalog material
- media missing
- source/provenance warning
- saved state
- dismissed state
- recommendation unavailable
- loading/skeleton
- authorization required
- reduced-motion preference

## 8. Governance requirements

- The discovery feed consumes `DiscoveryCatalogItem` records only.
- An item must be approved and discoverability-eligible before rendering.
- The UI labels Nuru’s recommendation separately from source facts.
- `Save`, `Not for me`, and pathway actions emit auditable `InterestSignal`
  events through a dedicated service.
- Users can inspect and delete their interest signals.
- Nuru agent outputs do not render as user-facing fact without catalog policy,
  source, and provenance checks.

## 9. Milestone 0 acceptance gate

- The five routes and their core states have an approved layout contract.
- Every Discover card has an explainability contract.
- Responsive behavior is specified for desktop, tablet, and mobile.
- Catalog eligibility and user feedback boundaries are explicit.
- The visual direction is documented without copying source assets.
