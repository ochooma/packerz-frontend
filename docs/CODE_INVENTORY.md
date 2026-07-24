# Packerz Existing Code Inventory

**Status:** Read-only inventory
**Inspection date:** 2026-07-24
**Repository:** `packerz-frontend`
**Branch inspected:** `main`
**Scope:** Existing source, configuration, tracked local data, generated/runtime
artifacts, dependencies, and Git state
**Constraint:** No source, data, configuration, asset, Git, or deployment file
was modified during this inventory

---

## 1. Classification

Every item receives one migration classification:

| Classification | Meaning |
|---|---|
| **Keep** | Fits the target responsibility and can remain with minor maintenance |
| **Refactor** | Concept or presentation has reuse value, but its contract/implementation must change |
| **Replace** | A new implementation must be introduced before the current item is retired |
| **Remove later** | Outside target scope or obsolete; retain until evidence, cutover, and deletion approval |
| **Unknown** | Ownership, data sensitivity, external state, or target use needs owner investigation |

Risk levels:

- **Critical:** Can expose data, manufacture/charge incorrectly, or claim false
  completion.
- **High:** Blocks a safe MVP or conflicts materially with target architecture.
- **Medium:** Creates maintainability, UX, reliability, or migration cost.
- **Low:** Cosmetic, boilerplate, or easily isolated.

Related-document abbreviations:

- PRD — `PRD.md`
- IA — `IA.md`
- FLOW — `USER_FLOW.md`
- SCREEN — `SCREENS.md`
- DB — `DATABASE.md`
- API — `API.md`
- ENGINE — `BOX_ENGINE.md`
- ADMIN — `ADMIN.md`
- ARCH — `ARCHITECTURE.md`
- PROD — `PRODUCTION.md`
- ROADMAP — `ROADMAP.md`

---

## 2. Inspection Coverage

### 2.1 Repository facts

| Item | Observed value |
|---|---|
| Tracked files | 58 |
| Tracked non-document source/config/data/assets | 49 |
| Current documents in `/docs` | 11 |
| Page routes | 6 |
| Next.js API Route Handler files | 4 |
| TSX files | 16 |
| TypeScript files excluding TSX | 13 |
| PHP files | 0 |
| SQL/migration files | 0 |
| Test/spec files | 0 |
| Deployment/IaC/CI files | 0 |
| Package manager | pnpm |
| Installed Node.js | 24.11.1 |
| Installed pnpm | 10.28.0 |

### 2.2 Exclusions

`node_modules` and `.next` were inspected only as dependency/build artifacts.
Their generated contents are not application source and were not inventoried
file-by-file.

No external AWS bucket, deployed EC2 host, PHP/GnuBoard installation, MySQL
database, payment provider, or DNS account was queried. Their current external
state is **Unknown**.

### 2.3 Quality baseline

| Check | Result | Notes |
|---|---|---|
| TypeScript | Pass | `tsc --noEmit --incremental false` |
| ESLint | Fail | 10 errors and 12 warnings |
| Production build | Not run | Would modify `.next`, prohibited by this task |
| Automated tests | None | No test runner, scripts, or test files |

Lint errors are `no-explicit-any` in draft/order/payment/upload code. Warnings
are unused `UI`, `button`, and `cn` imports.

---

## 3. Current Runtime Summary

The repository is a standalone Next.js prototype:

```text
Browser
├── React component state
├── localStorage package draft
├── sessionStorage uploaded-file metadata
└── query-string draft/payment identifiers
        ↓
Next.js App Router
├── in-memory global Map draft API
├── local JSON order API
├── local filesystem upload API
└── unauthenticated S3 presign API
        ↓
Local filesystem and/or private/unknown S3 bucket
```

There is no PHP, GnuBoard5, MySQL, JWT, guest identity, cart, checkout session,
authoritative quote, payment provider, Box Engine, dieline generation, admin,
production, QC, packing, shipping, CloudFront, Nginx, PM2, backup, or
observability implementation in this repository.

Current configuration and price logic model multiple package structures,
printing, artwork upload, and hundreds/thousands of units. That prototype model
conflicts with the approved unprinted, one-structure, sample/mockup/low-volume
MVP.

---

## 4. Current Page Routes

| Route | File | Classification | Current purpose | Problems | Reuse value | Target MVP responsibility | Related docs | Risk |
|---|---|---|---|---|---|---|---|---|
| `/` | `app/page.tsx` | Remove later | Default create-next-app landing page | Next.js/Vercel marketing; no Packerz scope or navigation | Layout example only | Packerz packaging landing page and Create Box CTA | PRD, IA, SCREEN | Low |
| `/package/configure` | `app/package/configure/page.tsx` | Replace | Five-step package/print configuration with client estimate | Three product structures, printing, high quantities, no server state/validation/dieline; refresh loses React state | Step layout and summary arrangement | New versioned one-box configuration at `/box/new` or `/box/{id}/configure` | PRD, IA, FLOW, ENGINE | High |
| `/package/upload` | `app/package/upload/page.tsx` | Remove later | Upload customer artwork/reference files directly to S3 | Print-artwork workflow is out of scope; no auth/size/type/checksum/quarantine/confirmation; leaks bucket/key metadata | Upload progress pattern could inform future approved support upload | No customer artwork upload in initial MVP; generated files come from Box Engine | PRD, ARCH, ROADMAP | Critical |
| `/package/review` | `app/package/review/page.tsx` | Replace | Capture buyer/tax/payment-method data and create in-memory draft | Pre-existing modified file; lacks configuration, files, shipping address, consent, quote, amount, idempotency and server ownership | Form field patterns and Korean validation copy | Guest checkout information/review backed by PHP checkout session | FLOW, SCREEN, API, DB | Critical |
| `/pay` | `app/pay/page.tsx` | Replace | Load in-memory draft and simulate payment | Pre-existing modified file; payment method and draft ID in query; no amount/provider/server verification; restart loses draft | Loading/error/summary presentation | Provider launch and authoritative payment-status screen | FLOW, API, ARCH | Critical |
| `/order/complete` | `app/order/complete/page.tsx` | Replace | Display “received” for any query-string ID | Claims completion without payment/order verification; exposes untrusted ID | Simple confirmation-card presentation | Verified order confirmation route `/orders/confirmation/{orderId}` | FLOW, SCREEN, API | Critical |
| `/favicon.ico` | `app/favicon.ico` | Replace | Default application icon | Not a Packerz brand asset | File location | Approved Packerz favicon | UI system decision | Low |

### 4.1 Referenced but missing page

`app/package/configure/_components/StepSize.tsx` links to
`/package/template`, but no route or static asset implements it. The link
currently resolves to a 404.

### 4.2 Missing target pages

There are no current routes for:

- requirements/purpose;
- validation;
- dieline generation/preview/export;
- cart;
- real checkout session;
- payment result/reconciliation;
- guest order lookup;
- customer orders/tracking/documents;
- support guides;
- admin/production/QC/machines/shipping/statistics/settings.

---

## 5. Current API Routes

All current Route Handlers are publicly callable unless deployment infrastructure
adds undocumented controls. No handler verifies authentication, ownership,
CSRF, origin, idempotency, resource version, or rate limit.

| Method and route | File | Classification | Current purpose | Problems | Reuse value | Target MVP responsibility | Related docs | Risk |
|---|---|---|---|---|---|---|---|---|
| `GET /api/orders` | `app/api/orders/route.ts` | Remove later | Return every record from `.local/orders.json` | Unauthenticated bulk order/PII/file metadata disclosure; Next.js acts as order DB | None beyond prototype response shape | Remove after PHP admin/customer scoped APIs exist | API, DB, ARCH | Critical |
| `POST /api/orders` | `app/api/orders/route.ts` | Replace | Accept arbitrary config, estimate, files, notes and write local JSON | No validation/auth/ownership/idempotency; client controls commercial/manufacturing data | Demonstrates a submit boundary | PHP checkout/order transaction using MySQL snapshots | API, DB, ARCH | Critical |
| `POST /api/orders/draft` | `app/api/orders/draft/route.ts` | Replace | Store arbitrary JSON in global in-memory Map | Lost on restart; no TTL/auth/ownership/validation; PII in process memory | Draft-create interaction pattern | PHP guest-owned `checkout_sessions` with typed validation | API, DB, FLOW | Critical |
| `GET /api/orders/draft?id=…` | `app/api/orders/draft/route.ts` | Replace | Return a draft by UUID | Bearer-by-ID access; no ownership; restart/PM2 process mismatch; no expiry | Loading/recovery concept | Authorized PHP checkout read | API, DB, ARCH | Critical |
| `POST /api/s3/presign` | `app/api/s3/presign/route.ts` | Replace | Create five-minute S3 PUT URLs | No auth, purpose, file count/size/type policy, checksum or quarantine; browser receives bucket/key; customer-controlled MIME | Key sanitization and direct-upload concept only | PHP-authorized upload intent if uploads enter scope; Box Engine owns generated outputs | ARCH, API, ENGINE | Critical |
| `POST /api/uploads` | `app/api/uploads/route.ts` | Remove later | Buffer multipart files and save under `.local/uploads` | Unauthenticated arbitrary upload; full file buffered; no limit/scan/retention; local disk not durable | None for target generated-file flow | Exclude from MVP; future support upload via private S3 quarantine | ARCH, ROADMAP | Critical |

### 5.1 Missing authoritative API

The complete `/api/v1` contract in `API.md` is not implemented. In particular,
there is no current API for guests, boxes, validation, quotes, dielines, cart,
checkout, payments, order lookup, production, QC, shipping, or admin.

---

## 6. React Component Inventory

| Component | File | Classification | Current purpose | Problems | Reuse value | Target MVP responsibility | Related docs | Risk |
|---|---|---|---|---|---|---|---|---|
| `RootLayout` | `app/layout.tsx` | Refactor | Load Geist fonts and global CSS | Metadata is “Create Next App”; `lang="en"` for Korean UI; no app shell/providers | Font loading and root layout | Korean-aware metadata, app shell, security/telemetry hooks | IA, UI requirements | Medium |
| `Home` | `app/page.tsx` | Remove later | Next/Vercel starter page | Entirely unrelated to Packerz; imports unused UI utilities | None except Next Image example | Packaging-only landing page | PRD, SCREEN | Low |
| `PackageConfigurePage` | `app/package/configure/page.tsx` | Replace | Hold config in React state; calculate SKU/estimate | Prototype model is wrong; no persistence hydration/server API/error states | Three-column responsive composition | New box-project shell consuming PHP resources | PRD, FLOW, API | High |
| `ConfigSteps` | `app/package/configure/_components/ConfigSteps.tsx` | Refactor | Gate five hardcoded steps; save local draft; route to upload | Includes product/print/upload flow; no async validation; state only | Step gating, child composition | Requirements → dimensions → material → validation workflow | FLOW, SCREEN | High |
| `NextBackBar` | `app/package/configure/_components/NextBackBar.tsx` | Refactor | Previous/next actions | Last label hardcoded to artwork upload; no pending/error behavior | Generic navigation bar | Accessible async step navigation | SCREEN | Medium |
| `StepProduct` | `app/package/configure/_components/StepProduct.tsx` | Remove later | Choose FC, sleeve, or RSC with MOQ | MVP allows one structure; MOQ/high-volume assumptions conflict | Card selection pattern | Purpose selection is a different new component | PRD, ROADMAP | High |
| `StepSize` | `app/package/configure/_components/StepSize.tsx` | Refactor | Width/depth/height and internal/external basis | Dimension terminology unresolved; accepts any finite/negative/decimal value; presets unapproved; missing template route; tells customer to design artwork | Field/segmented basis patterns; `Field` and `Radio` helpers | Approved dimension capture with server constraints and guide | ENGINE, PRD, SCREEN | High |
| `StepMaterial` | `app/package/configure/_components/StepMaterial.tsx` | Refactor | Hardcoded material choices by package type | Static catalog; print-oriented descriptions; no thickness/version/compatibility | Material-card UI | API-driven approved material/thickness choice | DB, API, ENGINE | High |
| `StepPrint` | `app/package/configure/_components/StepPrint.tsx` | Remove later | Choose no print, one-side 4C, or two-side 4C | Printing explicitly excluded | Card pattern already available elsewhere | No MVP responsibility | PRD, ROADMAP | High |
| `StepQuantityLead` | `app/package/configure/_components/StepQuantityLead.tsx` | Refactor | Free numeric quantity and standard/express lead | No approved range/integer validation; high-volume copy; lead/price client-controlled | Input and option layout | Server-constrained quantity and quoted lead-time display | PRD, API | High |
| `StepProgress` | `app/package/configure/_components/StepProgress.tsx` | Refactor | Display hardcoded five-step progress | Contains Print step; not data-driven; limited current-step semantics | Visual progress pattern | Requirements/configure/validate/dieline stepper | IA, SCREEN | Medium |
| `SummaryPanel` | `app/package/configure/_components/SummaryPanel.tsx` | Refactor | Display client config, print, estimate and SKU | Wrong product fields and client estimate; no revision/validation/dieline | Sticky summary, `Row` helper, KRW display | Server-authoritative specification/quote/revision summary | PRD, SCREEN, API | High |
| `UploadPage` | `app/package/upload/page.tsx` | Remove later | Multi-file S3 PUT with XHR progress | Out-of-scope artwork; insecure upload contract; records metadata only in sessionStorage | Progress UI only if approved future uploads exist | None in first slice | ARCH, ROADMAP | Critical |
| `PackageReviewPage` | `app/package/review/page.tsx` | Replace | Buyer, tax-document, payment-method form | Protected pre-existing edit; no checkout address/consents/items/amount; client-only validation | Some buyer/tax field UI and validators after legal decision | New server-backed checkout form | FLOW, SCREEN, API | Critical |
| `PayPage` | `app/pay/page.tsx` | Replace | Fetch draft and simulate payment | Protected pre-existing edit; false payment path; no provider/amount/status | Loading/error/order summary presentation | Authoritative provider/payment result flow | API, FLOW, ARCH | Critical |
| `OrderCompletePage` | `app/order/complete/page.tsx` | Replace | Show query ID as received order | No verification; unused UI imports | Confirmation-card shell | Verified paid/pending order confirmation | FLOW, SCREEN | Critical |

### 6.1 Component-local helpers

| Helper | Location | Classification | Notes |
|---|---|---|---|
| `Field`, `Radio` | `StepSize.tsx` | Refactor | Reusable only after units, decimal rules, labels, errors, and accessibility are standardized |
| `Row` | `SummaryPanel.tsx` | Keep | Simple semantic definition-row layout; rename/generalize if moved |
| `isEmail`, `isBizNo`, `isPhoneKR` | `review/page.tsx` | Refactor | Client hints only; server validation remains authoritative; business-number/tax policy undecided |
| `methodLabel` | `review/page.tsx`, `pay/page.tsx` | Refactor | Duplicated; final methods must come from payment-provider policy |

---

## 7. Shared Utility and Type Inventory

| Item | File | Classification | Current purpose | Problems | Reuse value | Target MVP responsibility | Related docs | Risk |
|---|---|---|---|---|---|---|---|---|
| `PackageConfig`, enums, `Estimate` | `types/package.ts` | Replace | Type prototype product/print/size/price | Three structures, print enums, optional invalid fields, JS numbers for money/dimensions | None as authoritative contract | Generated/shared v1 API types with decimal strings and revisions | API, DB, ENGINE | High |
| `saveDraft` | `lib/draft/packageDraft.ts` | Replace | Write config to `localStorage` key `pkg_draft_v1` | Browser becomes unowned draft store; PII risk if expanded; no schema/version validation | Optional non-authoritative UX recovery concept | PHP/MySQL guest-owned box draft; local cache only if explicitly safe | API, DB, ARCH | High |
| `loadDraft`, `clearDraft` | `lib/draft/packageDraft.ts` | Remove later | Read/clear local draft | Neither function is currently called; stale data persists | None until server hydration policy exists | Remove after server draft cutover | API, DB | Medium |
| `estimatePackagePrice` | `lib/pricing/packagePricing.ts` | Replace | Hardcoded client price estimate | Print multiplier, high-volume tiers, unapproved matrices, ignores height in size factor, client-authoritative number arithmetic | Formatting/display separation concept | PHP pricing rules and immutable quotes | PRD, API, DB | Critical |
| `formatKRW` | `lib/pricing/packagePricing.ts` | Refactor | Format integer as Korean number | Bound to wrong pricing module; no currency/decimal policy | High as presentation helper | Locale/currency utility for server money strings | API, UI requirements | Low |
| `buildPackageSku` | `lib/sku/packageSku.ts` | Replace | Build print/quantity SKU from client config | Encodes obsolete types/print/high-volume buckets; client generated | Naming concept only | Server-owned template/material/version identifiers; order snapshots | DB, API | High |
| `orderStore` | `lib/server/orderStore.ts` | Replace | Read/write `.local/orders.json` | Next.js is DB; catches all read errors as empty; non-atomic concurrent writes; `any`; local disk; random ID | None for production persistence | PHP/MySQL transactions and repositories | DB, ARCH | Critical |
| `presignPut` | `lib/server/s3Presign.ts` | Replace | Create five-minute S3 PUT URL | Initialized at module load with asserted env; no policy/checksum/size; returns bucket/key | AWS presign mechanics only | PHP upload-intent service or Box Engine S3 client; not frontend authority | ARCH, API | Critical |
| `cn` | `src/ui-rules.ts` | Refactor | Join truthy class strings | Does not resolve Tailwind conflicts; duplicates declared `clsx`/`tailwind-merge` dependencies | Medium | One tested class utility in UI system | UI requirements | Low |
| `UI` token object | `src/ui-rules.ts` | Refactor | Page/card/form/segmented class strings | Partial, internally inconsistent dark/light palette; mostly unused after current edits | Medium/high visual primitives | Formal Radius/Spacing/Button/Card/Typography/Color/Input/Icon/Animation system | ADMIN, UI requirements | Medium |
| `button` | `src/ui-rules.ts` | Refactor | Two Tailwind button variants | White-on-dark assumption; no size/destructive/loading; currently unused | Medium | Accessible variant-driven Button component | ADMIN, SCREEN | Medium |

---

## 8. Storage Mechanisms

| Storage | Path/key/implementation | Classification | Current use | Problems | Target replacement | Risk |
|---|---|---|---|---|---|---|
| React component memory | Configure/review/pay/upload `useState` | Refactor | Unsaved page-local UI | Reload/navigation loss; no authoritative revision | Server resources plus transient form state | Medium |
| Browser localStorage | `pkg_draft_v1` via `packageDraft.ts` | Replace | Package configuration draft | Unowned/stale; only saved, never loaded by current flow | Guest-owned PHP/MySQL box revision | High |
| Browser sessionStorage | `uploadedFiles` in `UploadPage` | Remove later | Bucket/key/file metadata between pages | Never read; exposes internal storage identifiers; disappears with tab | No artwork flow; authorized resource IDs only | High |
| URL query | `orderId`, `id`, `method` | Refactor | Draft/payment/confirmation context | IDs act as access keys; payment method is client controlled | Opaque public IDs plus authenticated/authorized server state | Critical |
| Process memory | `globalThis.__PACKERZ_DRAFT_STORE__` | Replace | Buyer/tax checkout draft | Process-local, no TTL, no owner, no persistence | MySQL `checkout_sessions` | Critical |
| Local JSON | `.local/orders.json` | Remove later | Two prototype order records | Tracked; may contain customer/file metadata; non-transactional | Classify/archive or validated one-time migration, then MySQL | Critical |
| Local JSONL | `.data/orders.jsonl` | Unknown | Two legacy order-event records | Tracked despite `.data/` ignore; contains buyer contact fields; no code references it | Owner classifies real/test data; secure archive or approved removal | Critical |
| Local uploads | `.local/uploads/*` | Unknown | Three duplicate PDFs and one PNG, approximately 30 MB | Tracked customer-originated filenames/content; not ignored; print-oriented; retention/legal status unknown | Owner-led secure evidence review, then private archive or approved removal | Critical |
| Local upload directory | `app/api/uploads/route.ts` | Remove later | Write arbitrary uploads | Not durable/secure/scanned; disk exhaustion | Exclude or private S3 quarantine | Critical |
| External S3 | `uploads/original/YYYY/MM/DD/...` | Unknown | Browser PUT objects from presigned route | Bucket contents were not inspected; possible orphan objects because metadata is only in sessionStorage | Inventory bucket read-only; private revisioned generated-object prefixes | Critical |
| `.next` | `.next/dev` (22 MB) | Remove later | Generated dev cache/output | Stale/incomplete and not deployable evidence | Rebuild artifact in CI; remain ignored | Low |
| `node_modules` | local install (446 MB) | Keep | Installed dependencies | Generated; never deploy as source | Reproducible `pnpm-lock.yaml` install | Low |

### 8.1 Tracked-data observation

`.data/orders.jsonl`, `.local/orders.json`, and all four `.local/uploads` files
are already Git-tracked. Adding ignore rules alone will not remove them from the
index or Git history. No untracking, deletion, history rewrite, archival, or
redaction is authorized by this inventory.

---

## 9. Mock and Temporary Data Sources

| Source | File | Classification | Content/purpose | Target action |
|---|---|---|---|---|
| Product options | `StepProduct.tsx` | Remove later | FC, sleeve, RSC; MOQ 100/300+ | Replace with one approved server template/purpose |
| Size presets | `StepSize.tsx` | Unknown | Three unapproved W×D×H presets | Keep disabled/remove unless factory approves |
| Material options | `StepMaterial.tsx` | Replace | SC350, IV300, E-flute hardcoded | Load versioned active catalog from PHP |
| Print options | `StepPrint.tsx` | Remove later | NP, 4C, 4C2 | Remove from MVP |
| Step labels | `StepProgress.tsx`, `ConfigSteps.tsx` | Replace | Product/size/material/print/quantity | Requirements/configure/validate/dieline |
| Pricing matrices | `packagePricing.ts` | Replace | Structure/material/print/lead/quantity factors | PHP pricing rules and quote snapshots |
| SKU buckets | `packageSku.ts` | Replace | Print/high-volume-derived SKU | Server template/material/version identifiers |
| Initial config | `configure/page.tsx` | Refactor | `STD`, `NP`, internal basis | Server/catalog defaults after approval |
| Draft Map | `orders/draft/route.ts` | Replace | Arbitrary buyer/tax JSON | MySQL checkout session |
| Mock payment | `pay/page.tsx` | Replace | Button navigates to completion | Provider create/confirm/webhook/status |
| Local orders | `.local/orders.json` | Unknown | Two prototype orders | Owner classification; do not blindly import |
| Legacy order events | `.data/orders.jsonl` | Unknown | Two event records with buyer fields | Owner classification/security review |
| Local upload samples | `.local/uploads/*` | Unknown | PDFs/PNG | Owner/legal/security review |

---

## 10. Commerce and Manufacturing Implementation Inventory

| Domain | Current implementation | Classification | Critical gap |
|---|---|---|---|
| Box draft | React state + `localStorage` save | Replace | No guest owner, revision, template/rules, validation |
| Box structures | FC/SL/RSC client options | Remove later | MVP permits one structure |
| Material | Client constants | Replace | No database catalog/version/thickness compatibility |
| Glue | None | Replace | Fixed method/rules not represented |
| Dimensions | `w/d/h` JS numbers | Refactor | Terminology unresolved; no decimal-string/server constraints |
| Quote | Client hardcoded estimate | Replace | No trusted price/expiry/lead snapshot |
| SKU | Client string | Replace | Obsolete product/print/quantity model |
| Dieline | None | Replace | No canonical geometry, SVG/PDF, revision, hash, preview |
| Upload | S3 PUT or local disk | Remove later | Artwork flow out of scope; unsafe |
| Cart | None | Replace | No cart owner/items/reprice/edit/remove |
| Buy Now | None | Replace | No single-item checkout creation |
| Checkout | Buyer/tax form posted to Map | Replace | No items, address, consent, totals, version, expiry |
| Guest | UI text only | Replace | No guest record/token/ownership/order verification |
| Order | Local JSON API not called by current UI | Replace | No immutable snapshots/MySQL/idempotency |
| Payment | Query method + simulated completion | Replace | No provider, amount, webhook, reconciliation |
| Order confirmation | Trusts query ID | Replace | No authoritative paid/pending state |
| Order tracking | None | Replace | No order-scoped auth/timeline |
| Admin | None | Replace | No GnuBoard admin/RBAC/audit |
| Production | Local type enum only | Replace | No jobs/stages/quantities/holds |
| QC | None | Replace | No checklist/results/rework |
| Packing/shipping | None | Replace | No eligible quantities/shipments/tracking |

---

## 11. S3 Implementation Inventory

### 11.1 Server utility

`lib/server/s3Presign.ts`:

- creates `S3Client({ region })`;
- reads `AWS_REGION` and `S3_BUCKET`;
- relies on the AWS SDK default credential provider chain;
- creates `PutObjectCommand` with bucket, key, and client-supplied content type;
- signs for five minutes;
- returns URL, bucket, and key.

### 11.2 Presign Route Handler

`app/api/s3/presign/route.ts`:

- accepts an unbounded `files[]` list containing name/type;
- sanitizes filenames to ASCII letters, numbers, dot, underscore, and dash;
- builds `uploads/original/YYYY/MM/DD/{timestamp}_{random}_{name}`;
- creates presigns concurrently;
- returns original name, content type, bucket, key, and URL.

### 11.3 Browser upload

`app/package/upload/page.tsx`:

- selects multiple files;
- requests presigns;
- PUTs each file with `XMLHttpRequest`;
- reports progress keyed by S3 key;
- writes S3 bucket/key metadata into sessionStorage;
- routes to review.

### 11.4 Missing S3 controls

There is no current:

- authentication or ownership;
- upload purpose;
- maximum file count/size;
- server-authorized MIME allowlist;
- checksum requirement;
- quarantine prefix;
- malware/content scan;
- upload-completion confirmation;
- object `HEAD` verification;
- database metadata record;
- object immutability/version relation;
- signed download;
- CloudFront integration;
- lifecycle/retention implementation;
- orphan cleanup;
- generated dieline storage;
- least-privilege IAM configuration in the repository.

### 11.5 Target disposition

Next.js must stop being the permanent S3 authorization authority. For the first
MVP slice:

- the Box Engine writes canonical geometry and SVG/PDF;
- PHP verifies and records immutable S3 metadata;
- PHP authorizes signed customer/admin reads;
- customer artwork upload remains disabled.

---

## 12. Environment Variables

### 12.1 Present and used

`.env.local` exists, is Git-ignored, has mode `0644`, and contains:

| Variable | Used by | Classification | Purpose/problem | Target |
|---|---|---|---|---|
| `AWS_REGION` | `lib/server/s3Presign.ts` | Replace | Select S3 region from Next process | Move S3 authority to PHP/Box Engine/instance role |
| `S3_BUCKET` | `lib/server/s3Presign.ts` | Replace | Target upload bucket | Split private generated/upload/backup responsibilities as approved |

Values were not copied into this document.

### 12.2 Implicit current expectations

| Variable/credential | Status | Notes |
|---|---|---|
| AWS SDK credentials/default chain | Expected but not declared | Local profile, environment credentials, or instance role; current source contains no explicit keys |
| `NODE_ENV` | Framework implicit | Next.js runtime |
| `PORT` | Framework/PM2 implicit | No PM2 config exists |

### 12.3 Target variables/configuration not implemented

Exact names require configuration approval. The target needs configuration for:

- PHP API origin used by Next.js SSR/client;
- exact allowed customer/admin origins;
- PHP/MySQL connection;
- JWT issuer/audiences/signing keys and cookie names;
- guest/order verification;
- S3 buckets/prefixes and signed URL policy;
- Box Engine internal API/queue identity;
- payment provider secrets/webhook keys;
- SES sender/domain;
- CloudWatch/runtime environment;
- feature flags and release identity.

There is no `.env.example` or typed environment validation.

---

## 13. Reusable UI Assets and Style Rules

### 13.1 Global styles

| Item | File | Classification | Current purpose | Problems | Reuse value | Target |
|---|---|---|---|---|---|---|
| Tailwind import | `app/globals.css` | Keep | Enable Tailwind 4 | None observed | High | Retain |
| `--background`, `--foreground` | `app/globals.css` | Refactor | Light/dark colors | Not approved Packerz palette | Medium | Formal color tokens |
| `@theme inline` fonts/colors | `app/globals.css` | Refactor | Expose CSS variables to Tailwind | Partial token system | Medium | UI System foundations |
| dark media override | `app/globals.css` | Unknown | Automatic dark theme | Admin/customer dark behavior not decided | Low | Remove later or formalize after decision |
| `.bg-white` global color override | `app/globals.css` | Remove later | Force readable text | Broadly changes every Tailwind white background; specificity workaround | Low | Use component tokens and semantic colors |
| muted text override under `.bg-white` | `app/globals.css` | Remove later | Increase contrast | `!important`, global coupling | Low | Accessible semantic text token |
| placeholder rule | `app/globals.css` | Refactor | Improve placeholder visibility | Not connected to approved input component | Medium | Accessible Input token |

### 13.2 `src/ui-rules.ts`

Current reusable names:

- layout: `page`, `pageTitle`, `pageDesc`;
- card: `card`, `cardHead`, `cardTitle`, `cardSub`, `cardBody`;
- form: `label`, `input`, `select`, `danger`;
- segmented control: `segBase`, `segIdle`, `segOn`;
- button variants: `primary`, `secondary`;
- class helper: `cn`.

The file has reuse value but is not consistently used. Current pages frequently
duplicate Tailwind strings, border radii (`rounded-xl`, `rounded-2xl`,
`rounded-3xl`), colors, buttons, inputs, and cards.

Target components should centralize Radius, Spacing, Button, Card, Typography,
Color, Input, Icon, Animation, focus, error, disabled, loading, and reduced
motion behavior.

### 13.3 Static assets

| Path | Classification | Current use | Target |
|---|---|---|---|
| `public/next.svg` | Remove later | Displayed on starter home | Replace with Packerz brand |
| `public/vercel.svg` | Remove later | Displayed on starter home | Remove after home replacement |
| `public/file.svg` | Remove later | Unused starter asset | Remove after asset audit |
| `public/globe.svg` | Remove later | Unused starter asset | Remove after asset audit |
| `public/window.svg` | Remove later | Unused starter asset | Remove after asset audit |
| `app/favicon.ico` | Replace | Default favicon | Approved Packerz favicon |

No Packerz logo, box diagram, dieline viewer asset, icon system, or illustration
set exists.

---

## 14. Direct Package Dependencies

Installed versions come from the current lock/install.

| Dependency | Version | Classification | Current purpose/use | Problems/target |
|---|---:|---|---|---|
| `next` | 16.0.5 | Keep | App Router/runtime | Keep customer frontend only |
| `react` | 19.2.0 | Keep | UI | Keep |
| `react-dom` | 19.2.0 | Keep | Browser/server rendering | Keep |
| `@aws-sdk/client-s3` | 3.970.0 | Remove later | Next Route Handler S3 client | Retire from frontend after PHP/Box Engine cutover unless a non-authoritative need is approved |
| `@aws-sdk/s3-request-presigner` | 3.970.0 | Remove later | Next PUT presigns | Retire with current presign route |
| `clsx` | 2.1.1 | Unknown | Declared but unused | Use in formal `cn` helper or remove later |
| `tailwind-merge` | 3.4.0 | Unknown | Declared but unused | Use for conflict-safe component variants or remove later |
| `@tailwindcss/postcss` | 4.1.17 | Keep | Tailwind/PostCSS integration | Keep |
| `tailwindcss` | 4.1.17 | Keep | Styling | Keep |
| `typescript` | 5.9.3 | Keep | Strict type checking | Add explicit typecheck script/contracts |
| `eslint` | 9.39.1 | Keep | Lint | Resolve baseline before merge gate |
| `eslint-config-next` | 16.0.5 | Keep | Next/TS rules | Keep |
| `@types/node` | 20.19.25 | Keep | Node types | Node runtime version policy needs alignment |
| `@types/react` | 19.2.7 | Keep | React types | Keep |
| `@types/react-dom` | 19.2.3 | Keep | React DOM types | Keep |

There are no direct dependencies for validation schemas, HTTP contracts,
testing, payment, JWT, MySQL, PDF/SVG generation, queues, telemetry, or
accessibility testing.

---

## 15. Configuration and Deployment Files

| Path/item | Classification | Current purpose | Problems | Target responsibility | Risk |
|---|---|---|---|---|---|
| `package.json` | Refactor | Scripts and direct dependencies | Only dev/build/start/lint; no typecheck/test/contract checks | CI-ready scripts and dependency ownership | Medium |
| `pnpm-lock.yaml` | Keep | Reproducible dependency graph | Must change only with reviewed dependency changes | Pin frontend installs | Low |
| `next.config.ts` | Refactor | Empty Next config | No security headers, output/deploy policy, image/host config | Approved frontend runtime settings | Medium |
| `tsconfig.json` | Refactor | Strict Next TypeScript | `allowJs`/`skipLibCheck`; no target contract boundaries | Keep strict; review build/test paths | Low |
| `eslint.config.mjs` | Keep | Next core-web-vitals/TS rules | Current code fails | Merge quality gate | Medium |
| `postcss.config.mjs` | Keep | Tailwind PostCSS plugin | None observed | Retain | Low |
| `.gitignore` | Refactor | Ignore generated/env and `.data/` | `.local/` absent; `.data` files already tracked | Approved data/artifact ignore policy | High |
| `app/api/orders/.gitignore` | Remove later | Contains `.data/` | Applies only below that directory; no current purpose | Remove after Git/data audit | Low |
| `.env.local` | Replace | Local S3 region/bucket | No schema/example; Next owns S3 authorization | Typed local config without secrets; target service config elsewhere | High |
| `README.md` | Replace | create-next-app/Vercel instructions | Wrong product/deployment target | Local development, architecture links, safe setup | Medium |
| `.next/` | Remove later | Local dev output | Not a production artifact; ignored | Build outside EC2, deploy versioned artifact | Low |
| `next-env.d.ts` | Keep | Generated Next types | Ignored and generated | Keep generated, do not hand-edit | Low |

### 15.1 Missing deployment assets

No current file implements:

- PM2 process configuration;
- Nginx virtual hosts;
- Ubuntu provisioning;
- CloudFront, ALB, S3, IAM, SES, or CloudWatch infrastructure;
- EC2 systemd configuration;
- build/release/rollback automation;
- Docker image/compose;
- CI pipeline;
- environment template/validation;
- MySQL migration;
- backup/binlog/restore job;
- health/readiness endpoints;
- release manifest.

The README still recommends Vercel, which conflicts with the approved
EC2/Nginx/PM2 architecture.

---

## 16. Git Working-Tree State

### 16.1 Repository state at inspection

| Item | Observed state |
|---|---|
| Branch | `main` |
| Upstream | `origin/main` |
| Local divergence from locally known upstream | 0 ahead / 0 behind |
| HEAD | `b661af90502424e6bb75c4ac1aec1b6b2fc6d7f9` |
| HEAD subject | `docs: add Packerz product architecture documents` |
| Existing stash | `stash@{0}: On main: wip before rebase` |
| Commit/push during inventory | None |

### 16.2 Pre-existing modified source files

These files were modified before this inventory and were not altered:

| File | SHA-256 at inspection start | State |
|---|---|---|
| `app/package/review/page.tsx` | `418fac4228f401483ec2ce3b2050daf0a89e9e94334da10cf1a076c00e8d2f32` | Modified |
| `app/pay/page.tsx` | `de621efd5eec002652f0d9b82622f6ff355799584dcae66751bb9a644060e497` | Modified |

They form the current draft/payment prototype and must not be used as the first
migration edit.

### 16.3 Documentation state before this inventory

- Modified: `docs/ARCHITECTURE.md`
- Untracked: `docs/PRODUCTION.md`
- Untracked: `docs/ROADMAP.md`

This task adds documentation only. Final status is rechecked after creating
`CODE_INVENTORY.md`, `MIGRATION_PLAN.md`, and `DECISIONS.md`.

### 16.4 Tracked local/customer-like data

Tracked repository history contains:

- `.data/orders.jsonl`;
- `.local/orders.json`;
- four `.local/uploads` binary files.

Their latest shared history includes commit `7a0adaa` (`wip: local ui tweaks
before pull`). Whether the records/files are test, customer, confidential, or
legally retained is unknown.

---

## 17. Current Risks

### Critical

1. `GET /api/orders` can disclose every local order without authentication.
2. Upload endpoints can authorize/write arbitrary files without ownership,
   content policy, size limits, quarantine, or scanning.
3. Payment completion is simulated by navigation and can show success for any
   query ID.
4. Draft access is bearer-by-UUID, process-local, unowned, and volatile.
5. Client code controls product, estimate, payment method, and completion flow.
6. Customer-like PII and binary uploads are tracked in Git.
7. S3 may contain orphan objects with no authoritative database record.

### High

1. Current product supports printing and multiple structures, contrary to MVP.
2. No Box Engine, dieline, SVG/PDF generation, or manufacturing validation.
3. No guest identity, cart, checkout, PHP API, MySQL, admin, or production.
4. Configuration/upload/review data are disconnected:
   - `localStorage` draft is not loaded;
   - `sessionStorage.uploadedFiles` is not read;
   - review draft contains neither configuration nor files.
5. Local JSON writes are non-transactional and unsafe under concurrency.
6. Dimension semantics and physical manufacturing rules are unapproved.

### Medium/low

- No tests or CI.
- ESLint baseline fails.
- Boilerplate metadata/assets/README.
- Duplicate styles and incomplete UI token system.
- Missing route referenced by the UI.
- No deploy, backup, monitoring, or rollback files.

---

## 18. Reusable Code

Reusable after approved refactoring:

- Next.js App Router, React, TypeScript, Tailwind, ESLint, pnpm foundation;
- responsive step/form/card composition;
- dimension field and internal/external basis interaction pattern;
- material-card interaction pattern;
- progress/navigation/summary layouts;
- KRW presentation helper concept;
- buyer/tax form controls, subject to commercial/legal decisions;
- loading/error/disabled/progress presentation patterns;
- `src/ui-rules.ts` as input to a real UI system, not as final tokens.

No current business, price, payment, order, storage, or manufacturing state
should be treated as authoritative or migrated unchanged.

---

## 19. Code to Retire After Safe Cutover

Retirement candidates, in dependency order:

1. print options and print price/SKU fields;
2. artwork/template-upload customer flow;
3. `/api/uploads` local-disk handler;
4. browser S3 presign flow and frontend AWS dependencies;
5. in-memory `/api/orders/draft`;
6. local JSON `/api/orders` and `orderStore`;
7. localStorage/sessionStorage as authoritative flow state;
8. mock payment and unverified completion page;
9. starter homepage/assets/README;
10. tracked local data only after owner/legal/security review and explicit
    deletion/untracking approval.

“Retire” does not authorize deletion in this task.

---

## 20. Inventory Conclusion

The current repository has useful UI scaffolding but no production business
foundation. Safe migration must introduce a parallel PHP/MySQL-owned vertical
slice and keep the legacy prototype untouched until the new slice proves:

```text
Guest ownership
→ one approved box configuration
→ server manufacturing validation
→ canonical geometry
→ SVG/PDF
→ private S3 metadata
→ authorized preview
```

The detailed sequence is defined in `MIGRATION_PLAN.md`.
