# Packerz Information Architecture

**Status:** Draft  
**Source:** [PRD.md](./PRD.md)  
**Scope:** MVP — custom unprinted boxes for samples, mockups, and low-volume production

## 1. Architecture Goals

The information architecture must support one continuous manufacturing transaction:

1. Define a box requirement.
2. Create a valid manufacturing specification.
3. Generate and approve a versioned dieline.
4. Purchase the approved design.
5. Convert confirmed payment into production work.
6. Track production through shipment.

The IA keeps customer commerce, production execution, and platform administration separate while linking them through immutable configuration, dieline, order, and production-job identifiers.

## 2. Audience and Access Model

| Area | Audience | Access |
|---|---|---|
| Public frontend | Any visitor | Public |
| Box project | Guest or identified customer | Project/session scoped |
| Cart and checkout | Guest or identified customer | Cart/session scoped |
| Customer orders | Verified guest or signed-in customer | Order/customer scoped |
| Operations | Support and production managers | Staff authentication |
| Production | Production managers and operators | Role-based staff authentication |
| Administration | Administrators | Administrator role |
| API | Browser, server, payment provider, internal tools | Endpoint-specific authentication and authorization |

Guest checkout is supported in the MVP. A successful order lookup creates a limited, order-scoped customer session; it does not grant access to other customer orders.

## 3. Complete Site Hierarchy

Routes below are proposed product routes, not an implementation instruction.

```text
Packerz
├── Public frontend
│   ├── /                                      Home
│   ├── /box/new                               Start box project / requirements
│   ├── /box/{projectId}/configure             Box configuration
│   ├── /box/{projectId}/validate              Validation and estimate
│   ├── /box/{projectId}/dieline               Dieline preview
│   ├── /box/{projectId}/dieline/export        SVG/PDF export
│   ├── /cart                                  Cart
│   ├── /checkout/{checkoutId}                 Checkout information and review
│   ├── /checkout/{checkoutId}/payment         Payment
│   ├── /checkout/{checkoutId}/payment/result  Payment result
│   ├── /orders/confirmation/{orderId}         Order confirmation
│   ├── /orders/lookup                         Guest order lookup
│   ├── /support                               Support landing
│   ├── /support/manufacturing-guide           Manufacturing guide
│   ├── /support/dimension-guide               Dimension guide
│   ├── /support/faq                           Frequently asked questions
│   └── /support/contact                       Contact
│
├── Customer pages
│   ├── /customer/orders                       Authorized order list
│   └── /customer/orders/{orderId}             Order detail and tracking
│       ├── Summary                            Order and payment summary
│       ├── Specification                      Approved box specification
│       ├── Production                         Status timeline
│       ├── Shipment                           Carrier and tracking information
│       └── Documents                          Approved SVG/PDF downloads
│
├── Operations pages
│   ├── /ops                                   Operations dashboard
│   ├── /ops/orders                            Order list
│   └── /ops/orders/{orderId}                  Internal order detail
│       ├── Customer                           Customer and delivery snapshot
│       ├── Payment                            Verified payment record
│       ├── Items                              Ordered configurations
│       ├── Dielines                           Approved design revisions
│       ├── Production                         Linked production jobs
│       └── Audit history                      Order event history
│
├── Production pages
│   ├── /production                            Production queue
│   ├── /production/schedule                   Production schedule
│   └── /production/jobs/{jobId}               Production job detail
│       ├── Work specification                 Dimensions, material, glue, quantity
│       ├── Dieline                            Production SVG/PDF
│       ├── Assignment                         Operator and schedule
│       ├── Status                             Allowed production transitions
│       ├── Notes                              Internal production notes
│       ├── /quality-check                     Quality-control record
│       └── /shipment                          Shipment registration
│
├── Admin pages
│   ├── /admin/login                           Staff sign-in
│   ├── /admin                                 Admin overview
│   ├── /admin/catalog/materials               Material catalog
│   ├── /admin/rules/manufacturing             Manufacturing constraints
│   ├── /admin/rules/pricing                   Pricing rules
│   ├── /admin/rules/lead-times                Lead-time rules
│   ├── /admin/staff                           Staff accounts
│   ├── /admin/staff/{staffId}                 Staff role and status
│   ├── /admin/audit-logs                      Audit log
│   └── /admin/settings                        System settings
│
└── API
    └── /api/v1
        ├── Box projects and configuration
        ├── Dielines and exports
        ├── Catalog and public rules
        ├── Cart
        ├── Checkout and payment
        ├── Customer orders
        ├── Production operations
        └── Administration
```

## 4. Frontend Hierarchy

### 4.1 Global navigation

The public header contains:

- Packerz logo → Home
- Create Box → New box project
- Manufacturing Guide → Support guide
- Track Order → Order lookup
- Cart → Active cart with item count

The customer order area adds:

- Orders
- Current order status
- Customer/session exit

The public footer contains:

- Manufacturing guide
- Dimension guide
- FAQ
- Contact
- Required business, privacy, and terms links

### 4.2 Box project

```text
Start project
└── Requirements
    └── Configuration
        └── Validation and estimate
            ├── Invalid → Configuration
            └── Valid → Dieline generation
                ├── Generation failed → Retry / Support
                └── Generated → Dieline preview
                    ├── Edit → Configuration revision
                    ├── Export → SVG/PDF export
                    ├── Add to Cart → Cart
                    └── Buy Now → Checkout
```

The project stepper must show:

1. Requirements
2. Configure
3. Validate
4. Dieline

Changing dimensions, material, or another manufacturing field creates a new configuration revision and invalidates the previous quote and dieline approval.

### 4.3 Cart and checkout

```text
Cart
├── Empty → Start project
├── Edit item → Project configuration
├── Remove item → Updated cart / Empty cart
├── Continue designing → Start or resume project
└── Checkout → Checkout information
    └── Review totals
        ├── Quote expired → Reprice / Return to cart
        └── Quote valid → Payment
            └── Payment result
                ├── Success → Order confirmation
                ├── Pending → Payment status
                ├── Failed → Retry payment
                └── Cancelled → Checkout
```

Buy Now uses the same checkout and server validations as Cart checkout. It creates a checkout session for one validated configuration and must not bypass quote, dieline, or payment verification rules.

### 4.4 Customer orders

```text
Order lookup
└── Verify customer/order credentials
    ├── Failed → Retry / Contact support
    └── Verified → Order detail
        ├── Production timeline
        ├── Shipment tracking
        └── Approved document downloads
```

The order-detail navigation is task-oriented rather than database-oriented. Customers see a single order timeline even if one order contains multiple internal production jobs.

## 5. Operations Hierarchy

The operations area manages the commercial order and acts as the bridge between customer service, payment, and production.

### 5.1 Operations dashboard

- New paid orders
- Orders awaiting review
- Orders on hold
- Jobs in production
- Quality-control failures
- Orders ready to ship
- Recent payment or production exceptions

### 5.2 Order management

- Order list
  - Search by order number, customer, phone, or email
  - Filter by order, payment, production, and shipment status
  - Filter by date
- Order detail
  - Commercial totals
  - Payment verification
  - Customer and shipping snapshots
  - Ordered specification and quantity
  - Approved dieline revision
  - Linked production jobs
  - Customer-visible and internal events

Operations staff can view design and production records but cannot silently modify an ordered specification. A specification correction requires an explicit revision and auditable approval process.

## 6. Production Hierarchy

### 6.1 Production queue

Queue groupings:

- Awaiting review
- On hold
- Design approved
- Production queued
- In production
- Quality check
- Ready to ship
- Recently completed

Queue filters:

- Priority
- Assigned operator
- Scheduled date
- Material
- Quantity
- Status

### 6.2 Production job

The production job is the primary operator workspace:

- Immutable work specification
- Dieline preview and download
- Quantity and material
- Fixed glue method
- Assignment and target dates
- Allowed next-status action
- Hold/release action with reason
- Internal notes
- Quality-control entry
- Shipment handoff
- Full status history

### 6.3 Quality control and shipment

Quality control is linked to a production job. Shipment is linked to the customer order so multiple jobs can be consolidated when required.

## 7. Admin Hierarchy

Administration controls the reference data that makes customer self-service possible.

### 7.1 Catalog

- Active materials
- Material thickness
- Customer-visible descriptions
- Availability and display order

### 7.2 Manufacturing rules

- Supported dimension ranges
- Material-specific restrictions
- Low-volume quantity limits
- Fixed glue-method definition
- Effective dates and rule versions

### 7.3 Commercial rules

- Unit and setup pricing
- Quantity tiers
- Shipping price inputs
- Lead-time rules
- Effective dates

Published rules are versioned. Existing quotes and orders retain the rule version used when they were created.

### 7.4 Security and governance

- Staff accounts
- Roles and permissions
- Staff activation/deactivation
- Audit logs
- System-wide settings

## 8. API Hierarchy

The API is not a navigable customer area. It is grouped by business capability and versioned under `/api/v1`.

### 8.1 Box projects and configuration

```text
/api/v1
├── /box-projects
│   ├── POST /
│   └── /{projectId}
│       ├── GET /
│       ├── PATCH /
│       └── /configurations
│           ├── POST /
│           └── GET /{configurationId}
└── /box-configurations/{configurationId}
    ├── POST /validate
    ├── POST /recommendations
    ├── POST /quote
    └── POST /dielines
```

### 8.2 Dielines

```text
/api/v1/dielines/{dielineId}
├── GET /
├── GET /preview
├── GET /export.svg
└── GET /export.pdf
```

### 8.3 Catalog

```text
/api/v1/catalog
├── GET /materials
├── GET /box-constraints
└── GET /production-options
```

### 8.4 Cart

```text
/api/v1/cart
├── GET /
├── POST /items
├── PATCH /items/{itemId}
├── DELETE /items/{itemId}
└── POST /reprice
```

### 8.5 Checkout and payment

```text
/api/v1
├── /checkout-sessions
│   ├── POST /
│   └── /{checkoutId}
│       ├── GET /
│       ├── PATCH /
│       └── POST /orders
├── /orders/{orderId}
│   ├── POST /payments
│   └── GET /payment
└── /payments
    ├── POST /{paymentId}/confirm
    └── POST /webhooks/{provider}
```

### 8.6 Customer orders

```text
/api/v1/orders
├── POST /lookup
└── /{orderId}
    ├── GET /
    ├── GET /status
    └── GET /documents
```

### 8.7 Production operations

```text
/api/v1/admin
├── /production-jobs
│   ├── GET /
│   └── /{jobId}
│       ├── GET /
│       ├── PATCH /status
│       ├── PATCH /assignment
│       ├── POST /notes
│       └── POST /quality-checks
└── /orders/{orderId}
    └── POST /shipments
```

### 8.8 Administration

```text
/api/v1/admin
├── /materials
│   ├── GET /
│   ├── POST /
│   └── PATCH /{materialId}
├── /manufacturing-rules
│   ├── GET /
│   ├── POST /
│   └── PATCH /{ruleId}
├── /pricing-rules
├── /lead-time-rules
├── /staff
├── GET /audit-logs
└── /settings
```

Admin endpoints beyond the PRD's initial API list are IA placeholders and require an API contract before implementation.

## 9. Navigation and State Rules

- The URL identifies the current project, checkout, order, or production resource.
- Sensitive IDs must not grant access without authorization.
- Browser storage must not be the system of record for paid orders or approved dielines.
- A refreshed page must be recoverable from server state after authorization.
- Back navigation must not duplicate an order or payment request.
- Cart, checkout, order, and payment mutations require idempotency protection where duplication would be harmful.
- Staff areas are excluded from public indexing.
- Customer order pages are excluded from public indexing and protected from enumeration.
- Expired, superseded, or unauthorized document links return a safe error and a recovery action.

## 10. Shared Page States

Every transactional area supports:

- Loading
- Empty
- Validation error
- Recoverable server error
- Permission denied
- Not found
- Success

Payment additionally supports:

- Ready
- Pending
- Paid
- Declined
- Cancelled
- Verification failed
- Duplicate callback handled idempotently

Production additionally supports:

- On hold
- Rework required
- Cancelled
- Refund pending
- Refunded

