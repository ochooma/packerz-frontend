# Packerz Screen Specifications

**Status:** Draft  
**Sources:** [PRD.md](./PRD.md), [IA.md](./IA.md), [USER_FLOW.md](./USER_FLOW.md)  
**Scope:** MVP customer, operations, production, and administration screens

## 1. Screen Conventions

- Proposed routes describe product IA and are not implementation commitments.
- Every transactional screen requires loading, empty, validation-error, recoverable-error, permission-denied, and success states where applicable.
- Customer screens expose only customer-safe data.
- Ordered specifications and dielines are immutable snapshots.
- Related API names are product-level contracts; implementation boundaries require technical design.

## 2. Public and Customer Screens

### C-01 — Home

- **Screen name:** Home
- **Purpose:** Explain Packerz as an AI packaging manufacturing platform and start the custom-box journey.
- **Main UI components:** Global header, hero, supported-use-case cards, “How it works,” automatic dieline explanation, material/quantity scope, primary Create Box CTA, Track Order CTA, support links, footer.
- **Related API:** `GET /api/v1/catalog/materials`, `GET /api/v1/catalog/box-constraints`, `GET /api/v1/catalog/production-options`
- **Next screen:** Project Requirements; Order Lookup; Support pages.

### C-02 — Project Requirements

- **Screen name:** Project Requirements
- **Purpose:** Create a project and capture whether the customer needs a sample, mockup, or low-volume production run.
- **Main UI components:** Progress stepper, purpose selector, requirement text input, optional AI-assistance panel, scope notice (“custom unprinted box”), save/continue action.
- **Related API:** `POST /api/v1/box-projects`, `PATCH /api/v1/box-projects/{projectId}`, `POST /api/v1/box-configurations/{configurationId}/recommendations`
- **Next screen:** Box Configuration; Home when cancelled.

### C-03 — Box Configuration

- **Screen name:** Box Configuration
- **Purpose:** Capture the exact manufacturing inputs for the custom box.
- **Main UI components:** Internal/external dimension selector, width/depth/height fields in millimeters, material cards, material details, read-only glue method, quantity selector, dimension help, live specification summary, Back and Validate actions.
- **Related API:** `GET /api/v1/catalog/materials`, `GET /api/v1/catalog/box-constraints`, `GET /api/v1/catalog/production-options`, `POST /api/v1/box-projects/{projectId}/configurations`, `GET /api/v1/box-projects/{projectId}/configurations/{configurationId}`
- **Next screen:** Validation and Estimate; Project Requirements; Dimension Guide.

### C-04 — Validation and Estimate

- **Screen name:** Validation and Estimate
- **Purpose:** Confirm manufacturability and show the server-calculated price and lead time.
- **Main UI components:** Validation status, blocking-issue list, field-level issue links, AI-assisted alternatives, configuration summary, unit price, subtotal, estimated lead time, quote expiry, Edit and Generate Dieline actions.
- **Related API:** `POST /api/v1/box-configurations/{configurationId}/validate`, `POST /api/v1/box-configurations/{configurationId}/recommendations`, `POST /api/v1/box-configurations/{configurationId}/quote`
- **Next screen:** Dieline Preview when valid; Box Configuration when invalid or edited.

### C-05 — Dieline Preview

- **Screen name:** Dieline Preview
- **Purpose:** Let the customer review the generated production geometry and the exact specification before purchase.
- **Main UI components:** Generation status, 2D dieline viewer, zoom/pan controls, cut/fold legend, dimension labels, specification summary, revision badge, price/lead-time summary, Edit, Export, Add to Cart, and Buy Now actions.
- **Related API:** `POST /api/v1/box-configurations/{configurationId}/dielines`, `GET /api/v1/dielines/{dielineId}`, `GET /api/v1/dielines/{dielineId}/preview`
- **Next screen:** Dieline Export; Cart; Checkout; Box Configuration.

### C-06 — Dieline Export

- **Screen name:** Dieline Export
- **Purpose:** Download the current dieline revision as SVG or PDF.
- **Main UI components:** Revision summary, format cards, file details, usage notice, SVG download, PDF download, generation/error state, return action.
- **Related API:** `GET /api/v1/dielines/{dielineId}`, `GET /api/v1/dielines/{dielineId}/export.svg`, `GET /api/v1/dielines/{dielineId}/export.pdf`
- **Next screen:** Dieline Preview.

### C-07 — Cart

- **Screen name:** Cart
- **Purpose:** Review all approved custom-box items before checkout.
- **Main UI components:** Cart-item cards, dieline thumbnail, specification summary, quantity, price, quote-expiry indicator, estimated lead time, Edit, Remove, Continue Designing, subtotal, shipping estimate, total, Checkout action, empty-cart state.
- **Related API:** `GET /api/v1/cart`, `POST /api/v1/cart/items`, `PATCH /api/v1/cart/items/{itemId}`, `DELETE /api/v1/cart/items/{itemId}`, `POST /api/v1/cart/reprice`
- **Next screen:** Checkout Information; Box Configuration when editing; Project Requirements when continuing or empty.

### C-08 — Checkout Information and Review

- **Screen name:** Checkout Information and Review
- **Purpose:** Capture customer and delivery data, required consent, and final order review.
- **Main UI components:** Customer form, recipient form, postal-code/address fields, consent controls, order-item summaries, dieline revision links, subtotal, shipping, tax, total, quote-validity notice, Back to Cart and Continue to Payment actions.
- **Related API:** `POST /api/v1/checkout-sessions`, `GET /api/v1/checkout-sessions/{checkoutId}`, `PATCH /api/v1/checkout-sessions/{checkoutId}`, `POST /api/v1/cart/reprice`, `POST /api/v1/checkout-sessions/{checkoutId}/orders`
- **Next screen:** Payment when valid; Cart or affected Box Configuration when an item/quote is invalid.

### C-09 — Payment

- **Screen name:** Payment
- **Purpose:** Create and complete a payment for the exact server-verified order amount.
- **Main UI components:** Order number, final amount, item summary, supported payment method selection, provider launch/embedded area, payment terms, Pay action, Cancel action, duplicate-submit protection.
- **Related API:** `POST /api/v1/orders/{orderId}/payments`, `GET /api/v1/orders/{orderId}/payment`
- **Next screen:** Payment Result; Checkout Information and Review when cancelled.

### C-10 — Payment Result

- **Screen name:** Payment Result
- **Purpose:** Display authoritative success, pending, failure, cancellation, or verification-error status.
- **Main UI components:** Status icon and title, order/payment reference, paid or expected amount, safe provider message, pending-status refresh, Retry Payment, Return to Checkout, Contact Support, View Order actions.
- **Related API:** `POST /api/v1/payments/{paymentId}/confirm`, `GET /api/v1/orders/{orderId}/payment`; provider callback uses `POST /api/v1/payments/webhooks/{provider}`
- **Next screen:** Order Confirmation on verified success; Payment on retry; Checkout Information and Review on cancellation; same screen while pending.

### C-11 — Order Confirmation

- **Screen name:** Order Confirmation
- **Purpose:** Confirm that payment was verified and the order entered production review.
- **Main UI components:** Success confirmation, order number, paid total, customer/delivery summary, item specifications, approved dieline revision, estimated lead time, initial status, Track Order and Download Documents actions.
- **Related API:** `GET /api/v1/orders/{orderId}`, `GET /api/v1/orders/{orderId}/status`, `GET /api/v1/orders/{orderId}/documents`
- **Next screen:** Order Detail and Tracking; Home.

### C-12 — Order Lookup

- **Screen name:** Order Lookup
- **Purpose:** Verify a guest customer and grant access to one order.
- **Main UI components:** Order number field, email or phone verification field, optional one-time verification step, privacy notice, Lookup action, not-found/error state, support link.
- **Related API:** `POST /api/v1/orders/lookup`
- **Next screen:** Order Detail and Tracking when verified; Contact Support after unresolved failure.

### C-13 — Customer Orders

- **Screen name:** Customer Orders
- **Purpose:** Show orders available to an authorized customer account or verified session.
- **Main UI components:** Order cards/table, order number, created date, total, production status, shipment status, search/filter, empty state.
- **Related API:** A customer-order collection endpoint is required by the IA but is not yet defined in the PRD; candidate: `GET /api/v1/orders`.
- **Next screen:** Order Detail and Tracking; Home/Create Box from the empty state.

### C-14 — Order Detail and Tracking

- **Screen name:** Order Detail and Tracking
- **Purpose:** Give the customer one reliable view of order, production, shipment, and approved documents.
- **Main UI components:** Order summary, customer-safe production timeline, item/specification cards, approved dieline preview, payment summary, shipment carrier/tracking, document downloads, support action.
- **Related API:** `GET /api/v1/orders/{orderId}`, `GET /api/v1/orders/{orderId}/status`, `GET /api/v1/orders/{orderId}/documents`
- **Next screen:** Carrier tracking destination; approved document download; Contact Support; Customer Orders.

## 3. Support Screens

### S-01 — Support Home

- **Screen name:** Support
- **Purpose:** Route customers to self-service manufacturing, measurement, ordering, and contact help.
- **Main UI components:** Search, guide cards, common FAQ links, order-help CTA, contact CTA.
- **Related API:** Content delivery endpoint or server-rendered content; no transactional MVP API required.
- **Next screen:** Manufacturing Guide; Dimension Guide; FAQ; Contact; Order Lookup.

### S-02 — Manufacturing Guide

- **Screen name:** Manufacturing Guide
- **Purpose:** Explain the MVP box, material, fixed glue method, dieline, quantity, production, and delivery concepts.
- **Main UI components:** Article navigation, diagrams, terminology, supported/unsupported scope, Create Box CTA.
- **Related API:** Content delivery endpoint or server-rendered content; `GET /api/v1/catalog/production-options` for live supported options if required.
- **Next screen:** Project Requirements; Support Home.

### S-03 — Dimension Guide

- **Screen name:** Dimension Guide
- **Purpose:** Teach customers how to measure internal and external width, depth, and height correctly.
- **Main UI components:** Measurement diagrams, internal/external comparison, millimeter examples, common mistakes, Return to Configuration CTA.
- **Related API:** `GET /api/v1/catalog/box-constraints`; content delivery endpoint or server-rendered content.
- **Next screen:** Box Configuration; Support Home.

### S-04 — Frequently Asked Questions

- **Screen name:** FAQ
- **Purpose:** Answer common questions about unprinted boxes, samples, quantities, dielines, payment, production, and shipping.
- **Main UI components:** Search, category tabs, accordion list, unresolved-question contact CTA.
- **Related API:** Content delivery endpoint or server-rendered content; no transactional MVP API required.
- **Next screen:** Contact; Project Requirements; Order Lookup.

### S-05 — Contact

- **Screen name:** Contact
- **Purpose:** Collect a support request that cannot be resolved through self-service content.
- **Main UI components:** Contact category, order number when relevant, name, email, phone, message, attachment policy, consent, submission result.
- **Related API:** Support-ticket endpoint is required by the IA but is not yet defined in the PRD.
- **Next screen:** Contact confirmation; Support Home; Order Detail when order-scoped.

## 4. Operations Screens

### O-01 — Operations Dashboard

- **Screen name:** Operations Dashboard
- **Purpose:** Summarize paid orders and operational exceptions requiring attention.
- **Main UI components:** KPI cards, new-paid-order list, awaiting-review list, on-hold list, production workload, QC failure alerts, ready-to-ship list, filters, recent event feed.
- **Related API:** `GET /api/v1/admin/production-jobs`; order-summary and operations-metrics endpoints are required but not yet defined in the PRD.
- **Next screen:** Internal Order Detail; Production Queue; Production Job Detail.

### O-02 — Internal Order List

- **Screen name:** Order List
- **Purpose:** Search and filter commercial orders across payment, production, and shipment states.
- **Main UI components:** Search, date filter, order-status filter, payment-status filter, production-status filter, shipment-status filter, sortable table, pagination, export action subject to authorization.
- **Related API:** An admin order collection endpoint is required; candidate: `GET /api/v1/admin/orders`.
- **Next screen:** Internal Order Detail.

### O-03 — Internal Order Detail

- **Screen name:** Order Detail
- **Purpose:** Provide the authoritative operational view of an order and its linked records.
- **Main UI components:** Order header/status, customer and delivery snapshots, payment record, item/specification panels, approved dieline, production-job links, shipment data, customer-visible events, internal notes, audit history.
- **Related API:** Admin order-detail endpoint required; `GET /api/v1/orders/{orderId}` is customer-scoped and insufficient for internal data. Production links use `GET /api/v1/admin/production-jobs/{jobId}`.
- **Next screen:** Production Job Detail; Shipment Registration; Audit Log; Order List.

## 5. Production Screens

### P-01 — Production Queue

- **Screen name:** Production Queue
- **Purpose:** Prioritize, filter, assign, and advance production jobs.
- **Main UI components:** Status columns or table, priority, schedule date, assignee, material, quantity, hold indicator, filters, bulk-safe assignment actions, job links.
- **Related API:** `GET /api/v1/admin/production-jobs`, `PATCH /api/v1/admin/production-jobs/{jobId}/assignment`
- **Next screen:** Production Job Detail; Production Schedule.

### P-02 — Production Schedule

- **Screen name:** Production Schedule
- **Purpose:** Plan approved jobs by date, capacity, and operator.
- **Main UI components:** Calendar/timeline, unscheduled queue, operator lanes, job cards, conflict warnings, assignment panel, date filters.
- **Related API:** `GET /api/v1/admin/production-jobs`, `PATCH /api/v1/admin/production-jobs/{jobId}/assignment`; a capacity/schedule endpoint may be added after the MVP contract is approved.
- **Next screen:** Production Job Detail; Production Queue.

### P-03 — Production Job Detail

- **Screen name:** Production Job Detail
- **Purpose:** Give production staff the immutable work specification and permitted workflow actions.
- **Main UI components:** Job number/status, dimensions, material, fixed glue method, quantity, approved dieline preview/download, assignment, schedule, allowed next-status action, Hold/Release controls, internal notes, status history, QC and shipment actions.
- **Related API:** `GET /api/v1/admin/production-jobs/{jobId}`, `PATCH /api/v1/admin/production-jobs/{jobId}/status`, `PATCH /api/v1/admin/production-jobs/{jobId}/assignment`, `POST /api/v1/admin/production-jobs/{jobId}/notes`
- **Next screen:** Quality Control; Shipment Registration; Production Queue; Internal Order Detail.

### P-04 — Quality Control

- **Screen name:** Quality Control
- **Purpose:** Record whether manufactured boxes pass, require rework, or need escalation.
- **Main UI components:** Job/specification summary, checklist, measurements, Pass/Fail/Conditional Pass choice, defect category, notes, evidence attachment policy, inspector identity, submit confirmation.
- **Related API:** `POST /api/v1/admin/production-jobs/{jobId}/quality-checks`, `PATCH /api/v1/admin/production-jobs/{jobId}/status`
- **Next screen:** Production Job Detail; In Production on rework; Shipment Registration after pass; On Hold after escalation.

### P-05 — Shipment Registration

- **Screen name:** Shipment Registration
- **Purpose:** Register shipment only after all required production work is ready.
- **Main UI components:** Order and recipient confirmation, package summary, carrier selector, tracking number, shipment date/time, address-hold warning, Register Shipment action.
- **Related API:** `POST /api/v1/admin/orders/{orderId}/shipments`
- **Next screen:** Internal Order Detail; Production Queue; carrier tracking destination.

## 6. Administration Screens

### A-01 — Staff Sign-In

- **Screen name:** Staff Sign-In
- **Purpose:** Authenticate staff before granting operations, production, or admin access.
- **Main UI components:** Identity fields or SSO action, credential recovery, security notice, error/lockout state.
- **Related API:** Authentication endpoint is determined by the GnuBoard/staff identity architecture and is not yet defined in the PRD.
- **Next screen:** Role-appropriate Operations Dashboard, Production Queue, or Admin Overview.

### A-02 — Admin Overview

- **Screen name:** Admin Overview
- **Purpose:** Navigate configuration, access, and governance tasks and show configuration health.
- **Main UI components:** Catalog/rules cards, active-rule versions, missing-configuration alerts, staff summary, audit shortcuts.
- **Related API:** Admin summary endpoint is required but not yet defined in the PRD.
- **Next screen:** Materials; Manufacturing Rules; Pricing and Lead Times; Staff Accounts; Audit Log; System Settings.

### A-03 — Materials

- **Screen name:** Materials
- **Purpose:** Manage the approved material catalog exposed to customers.
- **Main UI components:** Material table, code, name, thickness, description, active state, display order, create/edit form, impact warning.
- **Related API:** `GET /api/v1/admin/materials`, `POST /api/v1/admin/materials`, `PATCH /api/v1/admin/materials/{materialId}`
- **Next screen:** Materials; Manufacturing Rules; Admin Overview.

### A-04 — Manufacturing Rules

- **Screen name:** Manufacturing Rules
- **Purpose:** Manage versioned dimension, material, quantity, and fixed-glue constraints.
- **Main UI components:** Rule list, rule type, version, effective dates, active state, structured rule editor, validation preview, publish confirmation, affected-configuration warning.
- **Related API:** `GET /api/v1/admin/manufacturing-rules`, `POST /api/v1/admin/manufacturing-rules`, `PATCH /api/v1/admin/manufacturing-rules/{ruleId}`
- **Next screen:** Manufacturing Rules; Materials; Audit Log.

### A-05 — Pricing and Lead Times

- **Screen name:** Pricing and Lead Times
- **Purpose:** Manage versioned calculation rules used for quotes.
- **Main UI components:** Pricing-rule list, quantity tiers, material inputs, setup/unit costs, shipping inputs, lead-time rules, effective dates, calculation preview, publish action.
- **Related API:** Pricing and lead-time admin endpoints are IA placeholders and require an approved API contract.
- **Next screen:** Pricing and Lead Times; Audit Log; Admin Overview.

### A-06 — Staff Accounts and Roles

- **Screen name:** Staff Accounts
- **Purpose:** Manage staff access across operations, production, support, and administration.
- **Main UI components:** Staff list, search, role filter, active status, invite/create action, user detail drawer, role assignment, activate/deactivate confirmation.
- **Related API:** Staff-administration endpoints are required but not yet defined in the PRD.
- **Next screen:** Staff Detail; Audit Log; Admin Overview.

### A-07 — Staff Detail

- **Screen name:** Staff Detail
- **Purpose:** Review and change one staff member’s authorized role and status.
- **Main UI components:** Identity summary, external/GnuBoard identity reference, roles, active status, recent security/audit events, save and deactivate actions.
- **Related API:** Staff-administration and staff-audit endpoints are required but not yet defined in the PRD.
- **Next screen:** Staff Accounts; Audit Log.

### A-08 — Audit Log

- **Screen name:** Audit Log
- **Purpose:** Review material changes to orders, payments, production, rules, and staff access.
- **Main UI components:** Actor filter, action filter, entity filter, date range, event table, before/after viewer, IP metadata subject to policy, pagination.
- **Related API:** `GET /api/v1/admin/audit-logs`
- **Next screen:** Related Internal Order Detail, Production Job Detail, or admin record; Admin Overview.

### A-09 — System Settings

- **Screen name:** System Settings
- **Purpose:** Manage approved global platform settings that are not catalog or manufacturing rules.
- **Main UI components:** Setting groups, environment-aware read-only indicators, safe editable fields, validation, change summary, confirmation, audit notice.
- **Related API:** Settings endpoints are IA placeholders and require an approved API contract.
- **Next screen:** System Settings; Audit Log; Admin Overview.

## 7. Shared Non-Page UI

The following are reusable components or states, not standalone screens:

- Global customer header and footer
- Box-project progress stepper
- Specification summary
- Dieline viewer
- Price summary
- Cart indicator
- Customer-safe status timeline
- Staff status-transition control
- Confirmation dialog
- Toast/inline feedback
- Permission-denied state
- Not-found state
- Recoverable-error state
- Session-expired state

These components must not introduce alternate business rules. They consume the same server-authoritative resource states as their containing screens.

