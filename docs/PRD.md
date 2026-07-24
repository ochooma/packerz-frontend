# Packerz Product Requirements Document

**Product:** Packerz  
**Positioning:** AI Packaging Manufacturing Platform  
**Document status:** Draft  
**MVP product:** Custom unprinted box  

## 1. Product Vision

Packerz enables a customer to design, validate, order, and track custom packaging without needing packaging-engineering expertise or a manual quotation process.

The platform converts a customer's product requirements and dimensions into a manufacturable box specification, automatically generates the corresponding dieline, provides exportable SVG and PDF files, and connects the resulting design directly to payment and production management.

The long-term vision is to become the digital operating layer between packaging buyers and manufacturers:

- Customers describe what they need in familiar terms.
- Packerz turns those needs into production-ready packaging data.
- Manufacturing constraints are checked before an order is placed.
- Pricing, ordering, payment, and production status are managed in one workflow.
- Production data can eventually be routed to the most suitable manufacturing partner.

### MVP value proposition

> Enter the box requirements, receive a production-ready dieline, and order a sample or low-volume production run from one platform.

### MVP principles

- **Manufacturing first:** Every configuration must map to a producible box.
- **Simple decisions:** Expose only the choices required for the MVP.
- **Transparent output:** Customers can review dimensions, material, quantity, price, and dieline before payment.
- **Single source of truth:** The approved design revision and production order must remain linked.
- **No printing:** The MVP supports structural packaging only.

### Primary users

1. **Customer**
   - A brand owner, product developer, designer, or small business ordering packaging.
   - Needs a sample, mockup, or low-volume run without lengthy supplier coordination.

2. **Production manager**
   - Reviews paid orders, confirms manufacturability, schedules work, and updates production status.

3. **Production operator**
   - Uses the approved specification and dieline to manufacture and complete the order.

### MVP success indicators

- A customer can complete a valid custom-box order without staff assistance.
- Every paid order contains a versioned, downloadable SVG and PDF dieline.
- Operations can move an order from payment through production and shipment.
- Customer-visible totals match the payment amount and production order.
- Invalid dimensions or unsupported configurations are blocked before checkout.

## 2. MVP Scope

### Included

#### Product configuration

- One product category: **custom box**
- Unprinted box only
- Sample, mockup, and low-volume production purposes
- Customer-supplied width, depth, and height
- A limited set of approved materials and thicknesses
- One system-defined glue method
- Quantity selection within an approved low-volume range
- Basic AI-assisted recommendations based on the entered requirements
- Manufacturability validation against configured production limits
- Price and lead-time calculation

#### Dieline

- Automatic dieline generation from the approved box dimensions
- Dimension and fold/cut annotations
- Revision tracking
- In-browser dieline preview
- SVG export
- PDF export
- Immutable snapshot of the approved dieline attached to the order

#### Commerce

- Cart
- Cart item editing and removal
- Checkout
- Customer and delivery information
- Order summary
- Payment
- Payment result handling
- Order confirmation

#### Production management

- Production order created after confirmed payment
- Internal production queue
- Order detail with customer, specification, dieline, quantity, and payment data
- Status changes with timestamps
- Internal production notes
- Customer-visible order tracking

### Supported production stages

1. Payment confirmed
2. Awaiting review
3. Design approved
4. Production queued
5. In production
6. Quality check
7. Ready to ship
8. Shipped
9. Completed

Exception states:

- On hold
- Cancelled
- Refund pending
- Refunded

### Explicitly out of scope

- Sticker products
- Any printing, colors, artwork, coating, or print-file review
- Multiple glue-method choices
- High-volume mass production
- Multiple packaging structures beyond the MVP custom-box structure
- Advanced 3D rendering or photorealistic mockups
- Customer-created freeform vector editing
- Marketplace or manufacturer bidding
- International shipping, currencies, and taxes
- Subscription plans
- Complex discount, coupon, or loyalty systems
- Automated procurement of raw materials

### MVP assumptions

- The glue method is a fixed production default and is shown as read-only.
- The approved material catalog, dimensional limits, quantity limits, pricing rules, and lead-time rules are managed by Packerz operations.
- Payment confirmation is authoritative; an order must not enter production from an unverified client-side payment result.
- SVG and PDF are generated from the same versioned geometry source.
- Production staff can stop an order that requires manual review.

## 3. User Flow

### Customer purchase flow

1. **Landing**
   - Customer understands that Packerz creates custom unprinted boxes for samples and low-volume production.
   - Customer starts a new box project.

2. **Project requirements**
   - Customer selects the intended use: sample, mockup, or low-volume production.
   - Customer enters product or packaging requirements.
   - Packerz provides limited AI-assisted recommendations where applicable.

3. **Box configuration**
   - Customer enters internal or external width, depth, and height.
   - Customer selects an available material.
   - The fixed glue method is displayed.
   - Customer selects quantity.

4. **Validation and pricing**
   - The system validates dimensions and configuration against manufacturing rules.
   - Blocking issues must be resolved.
   - The system calculates unit price, total price, and estimated lead time.

5. **Dieline generation**
   - The system generates a versioned dieline.
   - Customer reviews the dieline preview and specification.
   - Customer can export SVG or PDF.
   - Any configuration change creates or requires a new dieline revision.

6. **Add to cart**
   - Customer adds the approved configuration and dieline revision to the cart.
   - The cart stores a price snapshot and the selected quantity.

7. **Cart review**
   - Customer reviews items, quantities, estimated lead times, and totals.
   - Customer can edit an item, which triggers revalidation and possibly a new dieline revision.

8. **Checkout**
   - Customer enters contact, recipient, address, and required consent information.
   - Customer confirms the final order and payment amount.

9. **Payment**
   - The server creates a payment request tied to the pending order.
   - The payment provider returns the payment result.
   - The server verifies the result and records the confirmed amount and transaction reference.

10. **Order confirmation**
    - The system creates the production order only after confirmed payment.
    - Customer receives the order number and summary.

11. **Tracking**
    - Customer views production and shipping status.
    - Customer can download the approved order documents.

### Production flow

1. A paid order appears in the production queue.
2. A production manager reviews the specification and dieline.
3. The order is approved or placed on hold with a reason.
4. The manager schedules the approved order.
5. An operator manufactures the required quantity.
6. The order passes quality control.
7. Shipping information is recorded.
8. The customer sees the updated status and tracking information.
9. The order is marked completed.

### Key flow rules

- A cart item must reference one exact configuration revision and dieline revision.
- A modified configuration invalidates the previous price and requires recalculation.
- A modified dimension or structure invalidates the previous dieline approval.
- Payment amount must be verified server-side before production creation.
- Production status changes must be recorded in an audit history.

## 4. Information Architecture

### Public/customer area

- **Home**
  - Product value proposition
  - Supported use cases
  - Start project

- **Box project**
  - Requirements
  - Configuration
  - Validation
  - Dieline preview
  - Export

- **Cart**
  - Cart items
  - Pricing summary
  - Edit/remove actions

- **Checkout**
  - Customer information
  - Shipping information
  - Consent
  - Payment

- **Orders**
  - Order confirmation
  - Order lookup
  - Order detail
  - Production tracking
  - Document downloads

- **Support**
  - Manufacturing guide
  - Dimension guide
  - Frequently asked questions
  - Contact

### Internal operations area

- **Dashboard**
  - New paid orders
  - Orders on hold
  - Production workload
  - Orders awaiting shipment

- **Orders**
  - Search and filters
  - Order detail
  - Payment information
  - Customer and shipping information

- **Production**
  - Queue
  - Schedule
  - Status updates
  - Quality-control result
  - Internal notes

- **Design data**
  - Box specifications
  - Dieline preview and downloads
  - Revision history

- **Catalog and rules**
  - Materials
  - Dimension constraints
  - Quantity limits
  - Pricing rules
  - Lead-time rules

- **Administration**
  - Staff accounts and roles
  - Audit log
  - System settings

## 5. Screen List

| ID | Screen | Audience | Purpose |
|---|---|---|---|
| C-01 | Home | Customer | Explain the product and start a box project |
| C-02 | Project requirements | Customer | Capture intended use and basic requirements |
| C-03 | Box configuration | Customer | Enter dimensions, material, quantity, and review the fixed glue method |
| C-04 | Validation and estimate | Customer | Display manufacturability results, price, and lead time |
| C-05 | Dieline preview | Customer | Review the generated dieline and specification |
| C-06 | Dieline export | Customer | Download the current SVG or PDF revision |
| C-07 | Cart | Customer | Review, edit, or remove configured boxes |
| C-08 | Checkout information | Customer | Capture contact, recipient, delivery address, and consent |
| C-09 | Payment | Customer | Confirm the amount and complete payment |
| C-10 | Payment result | Customer | Display success, pending, cancellation, or failure |
| C-11 | Order confirmation | Customer | Display the order number and paid-order summary |
| C-12 | Order lookup | Customer | Find an order using the supported identity verification method |
| C-13 | Order detail/tracking | Customer | Show production status, shipment, and downloadable documents |
| O-01 | Operations dashboard | Staff | Summarize actionable production and order states |
| O-02 | Order list | Staff | Search and filter customer orders |
| O-03 | Order detail | Staff | Review payment, specification, customer, and shipping data |
| O-04 | Production queue | Staff | Prioritize and assign approved production work |
| O-05 | Production job detail | Staff | View the approved dieline and update production status |
| O-06 | Quality control | Staff | Record inspection result and exceptions |
| O-07 | Shipment registration | Staff | Record carrier, tracking number, and shipment time |
| O-08 | Materials and rules | Admin | Manage allowed materials and manufacturing constraints |
| O-09 | Pricing and lead times | Admin | Manage calculation rules and effective dates |
| O-10 | Audit log | Admin | Review important staff and system events |

### Required states

Each transactional screen must define:

- Loading
- Empty
- Validation error
- Recoverable server error
- Permission denied
- Success

Payment screens additionally require:

- Pending
- Cancelled by customer
- Declined
- Verification failed
- Duplicate callback

## 6. Database Draft

The following is a logical MySQL draft. Exact naming, indexes, and GnuBoard integration boundaries require technical design approval.

### Identity and access

#### `customers`

- `id`
- `email`
- `phone`
- `name`
- `created_at`
- `updated_at`

Guest checkout may use an order-specific lookup credential instead of requiring a customer account.

#### `staff_users`

- `id`
- `gnu_member_id` or external identity reference
- `name`
- `role` (`admin`, `production_manager`, `operator`, `support`)
- `is_active`
- `created_at`
- `updated_at`

### Product design

#### `box_projects`

- `id`
- `customer_id` nullable
- `guest_session_id` nullable
- `name`
- `purpose` (`sample`, `mockup`, `low_volume`)
- `status` (`draft`, `validated`, `in_cart`, `ordered`, `archived`)
- `created_at`
- `updated_at`

#### `box_configurations`

- `id`
- `project_id`
- `revision_number`
- `dimension_basis` (`internal`, `external`)
- `width_mm`
- `depth_mm`
- `height_mm`
- `material_id`
- `glue_method_code`
- `quantity`
- `ai_recommendation_json` nullable
- `validation_status`
- `validation_result_json`
- `created_at`

Configuration revisions are append-only after they are referenced by a cart item or order.

#### `materials`

- `id`
- `code`
- `name`
- `thickness_mm`
- `description`
- `is_active`
- `sort_order`
- `created_at`
- `updated_at`

#### `manufacturing_rules`

- `id`
- `code`
- `rule_type`
- `rule_json`
- `effective_from`
- `effective_to` nullable
- `is_active`
- `created_at`
- `updated_at`

#### `dielines`

- `id`
- `configuration_id`
- `revision_number`
- `generator_version`
- `geometry_hash`
- `svg_storage_key`
- `pdf_storage_key`
- `preview_storage_key` nullable
- `width_mm`
- `height_mm`
- `status` (`generated`, `failed`, `superseded`, `approved`)
- `generated_at`
- `approved_at` nullable

### Pricing and cart

#### `price_quotes`

- `id`
- `configuration_id`
- `currency`
- `unit_price`
- `subtotal`
- `tax_amount`
- `shipping_amount`
- `total_amount`
- `lead_time_days`
- `pricing_rule_version`
- `expires_at`
- `created_at`

#### `carts`

- `id`
- `customer_id` nullable
- `guest_session_id` nullable
- `status` (`active`, `converted`, `abandoned`)
- `currency`
- `created_at`
- `updated_at`

#### `cart_items`

- `id`
- `cart_id`
- `configuration_id`
- `dieline_id`
- `price_quote_id`
- `quantity`
- `created_at`
- `updated_at`

### Checkout, payment, and orders

#### `checkout_sessions`

- `id`
- `cart_id`
- `customer_snapshot_json`
- `shipping_address_snapshot_json`
- `consent_snapshot_json`
- `status` (`started`, `payment_pending`, `completed`, `expired`)
- `expires_at`
- `created_at`
- `updated_at`

#### `orders`

- `id`
- `order_number`
- `customer_id` nullable
- `checkout_session_id`
- `status`
- `currency`
- `subtotal`
- `tax_amount`
- `shipping_amount`
- `total_amount`
- `customer_snapshot_json`
- `shipping_address_snapshot_json`
- `paid_at` nullable
- `cancelled_at` nullable
- `created_at`
- `updated_at`

#### `order_items`

- `id`
- `order_id`
- `configuration_id`
- `dieline_id`
- `product_name`
- `specification_snapshot_json`
- `unit_price`
- `quantity`
- `line_total`
- `created_at`

#### `payments`

- `id`
- `order_id`
- `provider`
- `provider_payment_id`
- `idempotency_key`
- `method`
- `status` (`ready`, `pending`, `paid`, `failed`, `cancelled`, `refunded`)
- `requested_amount`
- `confirmed_amount` nullable
- `failure_code` nullable
- `failure_message` nullable
- `requested_at`
- `confirmed_at` nullable
- `created_at`
- `updated_at`

#### `payment_events`

- `id`
- `payment_id`
- `provider_event_id`
- `event_type`
- `payload_json`
- `received_at`
- `processed_at` nullable
- `processing_result`

Provider event identifiers must be unique to prevent duplicate processing.

### Production and fulfillment

#### `production_jobs`

- `id`
- `order_item_id`
- `job_number`
- `status`
- `priority`
- `assigned_staff_id` nullable
- `scheduled_start_at` nullable
- `started_at` nullable
- `completed_at` nullable
- `hold_reason` nullable
- `created_at`
- `updated_at`

#### `production_status_history`

- `id`
- `production_job_id`
- `from_status` nullable
- `to_status`
- `changed_by_staff_id` nullable
- `customer_visible_message` nullable
- `internal_note` nullable
- `created_at`

#### `quality_checks`

- `id`
- `production_job_id`
- `result` (`pass`, `fail`, `conditional_pass`)
- `checklist_json`
- `notes` nullable
- `checked_by_staff_id`
- `checked_at`

#### `shipments`

- `id`
- `order_id`
- `carrier_code`
- `tracking_number`
- `status`
- `shipped_at` nullable
- `delivered_at` nullable
- `created_at`
- `updated_at`

#### `audit_logs`

- `id`
- `actor_type`
- `actor_id` nullable
- `action`
- `entity_type`
- `entity_id`
- `before_json` nullable
- `after_json` nullable
- `ip_address` nullable
- `created_at`

### Storage policy

- MySQL stores business records and S3 object keys, not large design files.
- S3 stores generated SVG, PDF, and preview assets.
- Customer downloads should use time-limited URLs or an authorized download endpoint.
- Ordered design revisions must not be overwritten.

## 7. API List

The paths below are a product-level draft. The final boundary between Next.js, PHP/GnuBoard, and internal services requires a separate architecture decision.

### Box projects and configuration

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/box-projects` | Create a box project |
| `GET` | `/api/v1/box-projects/{projectId}` | Get the project and current revision |
| `PATCH` | `/api/v1/box-projects/{projectId}` | Update project metadata |
| `POST` | `/api/v1/box-projects/{projectId}/configurations` | Create a configuration revision |
| `GET` | `/api/v1/box-projects/{projectId}/configurations/{configurationId}` | Get one configuration revision |
| `POST` | `/api/v1/box-configurations/{configurationId}/validate` | Validate manufacturability |
| `POST` | `/api/v1/box-configurations/{configurationId}/recommendations` | Generate AI-assisted recommendations |
| `POST` | `/api/v1/box-configurations/{configurationId}/quote` | Calculate price and lead time |

### Dielines

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/box-configurations/{configurationId}/dielines` | Generate a new dieline revision |
| `GET` | `/api/v1/dielines/{dielineId}` | Get dieline metadata and generation status |
| `GET` | `/api/v1/dielines/{dielineId}/preview` | Get an authorized preview |
| `GET` | `/api/v1/dielines/{dielineId}/export.svg` | Download SVG |
| `GET` | `/api/v1/dielines/{dielineId}/export.pdf` | Download PDF |

Generation should be idempotent for the same configuration revision and generator version.

### Catalog and rules

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/catalog/materials` | List available materials |
| `GET` | `/api/v1/catalog/box-constraints` | Get customer-visible dimension and quantity constraints |
| `GET` | `/api/v1/catalog/production-options` | Get the supported glue method and other fixed options |

### Cart

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/cart` | Get the active cart |
| `POST` | `/api/v1/cart/items` | Add a validated configuration and dieline |
| `PATCH` | `/api/v1/cart/items/{itemId}` | Change quantity or approved editable fields |
| `DELETE` | `/api/v1/cart/items/{itemId}` | Remove an item |
| `POST` | `/api/v1/cart/reprice` | Refresh expired price quotes |

### Checkout and payments

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/checkout-sessions` | Start checkout from the active cart |
| `GET` | `/api/v1/checkout-sessions/{checkoutId}` | Get checkout state and totals |
| `PATCH` | `/api/v1/checkout-sessions/{checkoutId}` | Save customer, shipping, and consent data |
| `POST` | `/api/v1/checkout-sessions/{checkoutId}/orders` | Create a pending order |
| `POST` | `/api/v1/orders/{orderId}/payments` | Create a payment request |
| `POST` | `/api/v1/payments/{paymentId}/confirm` | Verify and confirm the payment server-side |
| `POST` | `/api/v1/payments/webhooks/{provider}` | Receive signed provider events |
| `GET` | `/api/v1/orders/{orderId}/payment` | Get customer-safe payment status |

All order creation and payment mutation endpoints require idempotency protection.

### Customer orders

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/orders/lookup` | Verify a guest and locate an order |
| `GET` | `/api/v1/orders/{orderId}` | Get authorized order detail |
| `GET` | `/api/v1/orders/{orderId}/status` | Get customer-visible production and shipment status |
| `GET` | `/api/v1/orders/{orderId}/documents` | List approved order documents |

### Production operations

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/admin/production-jobs` | List and filter production jobs |
| `GET` | `/api/v1/admin/production-jobs/{jobId}` | Get full production job detail |
| `PATCH` | `/api/v1/admin/production-jobs/{jobId}/status` | Move a job through an allowed status transition |
| `PATCH` | `/api/v1/admin/production-jobs/{jobId}/assignment` | Assign or schedule a job |
| `POST` | `/api/v1/admin/production-jobs/{jobId}/notes` | Add an internal note |
| `POST` | `/api/v1/admin/production-jobs/{jobId}/quality-checks` | Record a quality-control result |
| `POST` | `/api/v1/admin/orders/{orderId}/shipments` | Register shipment and tracking data |

### Administration

| Method | Endpoint | Purpose |
|---|---|---|
| `GET/POST` | `/api/v1/admin/materials` | List or create materials |
| `PATCH` | `/api/v1/admin/materials/{materialId}` | Update material availability |
| `GET/POST` | `/api/v1/admin/manufacturing-rules` | List or create rules |
| `PATCH` | `/api/v1/admin/manufacturing-rules/{ruleId}` | Update a versioned rule |
| `GET` | `/api/v1/admin/audit-logs` | Search audit events |

## 8. Future Roadmap

### Phase 1 — MVP

- One custom unprinted box structure
- Sample, mockup, and low-volume quantities
- One fixed glue method
- Automatic dieline generation
- SVG and PDF export
- Manufacturability validation
- Pricing and lead-time estimate
- Cart, checkout, and payment
- Internal production queue and tracking

### Phase 2 — Better design intelligence

- Product-dimension-to-box recommendations
- Material recommendations based on weight, fragility, and use
- AI explanation of manufacturability issues
- Alternative dimension suggestions
- Interactive 2D dieline editor with controlled constraints
- Basic 3D folding preview
- Saved customer projects and reorder

### Phase 3 — Expanded packaging catalog

- Additional box structures
- Additional closure and glue methods
- Inserts and dividers
- Corrugated and paperboard variations
- Finishing options that do not require printing
- Broader quantity ranges
- More advanced shipping and packaging optimization

### Phase 4 — Printing and artwork

- Printed packaging options
- Artwork upload and preflight
- Color and finish selection
- Proof approval workflow
- Print-ready file generation
- Versioned design collaboration

Printing is intentionally deferred until the structural manufacturing workflow is stable.

### Phase 5 — Manufacturing network

- Multi-factory capacity and capability model
- Automated factory routing
- Manufacturer portal
- Quote comparison and bidding
- Production capacity forecasting
- Raw-material and inventory integration
- SLA and quality performance analytics

### Phase 6 — Platform expansion

- Packaging lifecycle analytics
- Cost and material optimization
- Sustainability scoring
- International shipping, currencies, and localization
- Enterprise purchasing controls and approvals
- Public API and ERP/PIM/e-commerce integrations
- White-label packaging configuration

