# Ruban Rouge website: specification

Status legend: **Done** (built and verified), **Next** (planned milestone), **Later** (post-MVP).
Requirements use EARS: *When <trigger>, the system shall <response>.*

## 1. Overview and user value
Customers, mostly arriving from Instagram or WhatsApp on a phone, should reach a product, order it (pickup or Meknes delivery) and pay on receipt in a few taps, in French, Arabic or English. The owners should keep prices, availability and hours current without editing code.

Source of truth for facts: `src/data/bakery.ts`. Values marked `TODO_OWNER` are unknown and must never be invented; a launch build fails while any remain.

## 2. Functional requirements

### 2.1 Site shell and i18n
| ID | Requirement | Status |
|---|---|---|
| F-I18N-1 | The system shall serve every page under `/fr`, `/ar` and `/en`, with French as the default locale. | Done |
| F-I18N-2 | While the locale is Arabic, the system shall render right-to-left with Arabic-capable fonts. | Done |
| F-I18N-3 | When the visitor switches language, the system shall keep them on the equivalent page. | Done (query string is not preserved) |
| F-I18N-4 | The system shall provide identical translation keys and ICU placeholders in all three languages. | Done (unit test) |
| F-NAV-1 | The system shall provide a skip link, a keyboard-operable header menu closing on Escape, and a floating call/WhatsApp button. | Done |

### 2.2 Home, Menu, Story
| ID | Requirement | Status |
|---|---|---|
| F-HOME-1 | The Home page shall show hero, signature products, how ordering works, occasions, story teaser, and hours with live open/closed status. | Done |
| F-HOME-2 | Where no owner-approved reviews exist, the system shall omit the reviews section. | Done |
| F-MENU-1 | When the visitor selects a category or types a search, the system shall filter products, ignoring case and diacritics, and reflect the filter in the URL. | Done |
| F-MENU-2 | The system shall include every product in the server-rendered HTML of `/menu`. | Done |
| F-MENU-3 | Where a price is unknown, the system shall show "price soon" rather than a number. | Done |
| F-MENU-4 | Where a product is flagged fresh today or sold out, the system shall show that badge. | Done (flags default off until the admin exists) |
| F-STORY-1 | The Story page shall present the timeline and values, and shall not ship unconfirmed claims to production. | Done (build gate) |

### 2.3 Contact
| ID | Requirement | Status |
|---|---|---|
| F-CON-1 | When a visitor submits the contact form, the system shall validate name, message and at least one of email or phone on the client and again on the server. | Done |
| F-CON-2 | If validation fails, the system shall show a translated message per field and move focus to the first invalid field. | Done |
| F-CON-3 | When a valid message is accepted, the system shall store it, notify the owners by email, and optionally mirror it to Notion; delivery succeeds if at least one channel succeeds. | Done (adapters; needs keys) |
| F-CON-4 | If a hidden honeypot field is filled, the system shall return success and deliver nothing. | Done |
| F-CON-5 | If more than 5 submissions arrive from one address within 10 minutes, the system shall respond 429 with Retry-After. | Done (per instance; see risks) |
| F-CON-6 | While in production, the system shall refuse submissions without a valid Turnstile token and shall answer 503 when no delivery channel is configured. | Done |

### 2.4 Shop, cart, checkout (milestone c)
| ID | Requirement | Status |
|---|---|---|
| F-CART-1 | When a customer adds a product, the system shall update a cart drawer, persisted across visits, with quantity controls and a per-item note. | Done (demo mode: browser storage, no real back end yet) |
| F-CART-2 | The system shall disable "add" for sold-out products and products with no price. | Done (demo mode: browser storage, no real back end yet) |
| F-CHK-1 | The system shall offer in-store pickup with a date/time slot picker that respects opening hours, slot length and a configurable lead time. | Done (demo mode: browser storage, no real back end yet) |
| F-CHK-2 | The system shall offer delivery within Meknes with a configurable fee, free-above threshold and minimum order. | Done (demo mode: browser storage, no real back end yet) |
| F-CHK-3 | The system shall recompute all prices on the server and ignore client-supplied totals. | Done (demo mode: browser storage, no real back end yet) |
| F-CHK-4 | The system shall support pay at pickup / cash on delivery now, behind a `PaymentProvider` interface for a later online provider. All prices in MAD. | Done (demo mode: browser storage, no real back end yet) |
| F-CHK-5 | When an order is placed, the system shall show a confirmation page and offer a pre-filled WhatsApp message with the order summary. | Done (demo mode: browser storage, no real back end yet) |
| F-ADM-1 | The system shall provide a protected `/admin` where the owners edit products, prices, availability (including fresh today / sold out) and opening hours, and view orders. | Done (demo mode: browser storage, no real back end yet) |

### 2.5 Creative features (milestone d)
| ID | Requirement | Status |
|---|---|---|
| F-CAKE-1 | The Cake Studio shall guide the customer through occasion, servings, flavour, filling, frosting, decorations, dedication, reference photo, date and budget, with a live summary and an estimated price range, then send the request to the bakery. | Done (demo mode: browser storage, no real back end yet) |
| F-BOX-1 | The Box Builder shall let the customer fill a 6, 12 or 24 item box visually and tie the red ribbon when full. | Done (demo mode: browser storage, no real back end yet) |
| F-GIFT-1 | The system shall let a customer send a box or cake to another person with a personal message card. | Done (demo mode: browser storage, no real back end yet) |
| F-OCC-1 | The system shall present occasion collections (Ramadan, Eid, Mawlid, weddings, engagements, graduations, corporate) with curated bundles and pre-order windows. | Done (demo mode: browser storage, no real back end yet) |
| F-FRESH-1 | The system shall show a "fresh from the oven today" board driven by availability flags. | Done (demo mode) |
| F-SUB-1, F-LOY-1, F-QUIZ-1 | Subscription, loyalty stamp card, recommendation quiz. | Later |

## 3. Non-functional requirements
| ID | Requirement | Status |
|---|---|---|
| NF-A11Y-1 | The system shall meet WCAG 2.2 AA: contrast-checked palette, keyboard operation, visible focus, semantic landmarks, translated labels, reduced-motion support. | Done (axe scans pass on every page, fr and ar, at 360 and 1440) |
| NF-RESP-1 | The system shall render without horizontal scrolling at 360, 768, 1024 and 1440 px in every locale. | Done (checked) |
| NF-PERF-1 | Mobile Lighthouse Performance, Accessibility, SEO and Best Practices shall each be 90 or higher. | Partly: Accessibility, Best Practices and SEO are 98-100; Performance is 70-86 on a throttled phone profile (desktop 95-99), to be re-measured on the real host |
| NF-SEC-1 | The system shall send baseline security headers and a Content-Security-Policy on every response. | Done (script-src still needs unsafe-inline; see README) |
| NF-SEC-2 | The system shall escape all user text in emails, keep secrets server-side, and never log message content. | Done |
| NF-SEC-3 | The database shall have row-level security enabled with no public policies. | Done (contact messages) |
| NF-SEO-1 | The system shall provide canonical and hreflang links, LocalBusiness JSON-LD, sitemap and robots. | Done |
| NF-PRIV-1 | The system shall tell visitors what personal data is stored and for how long, and the owners shall be able to delete it. | Next (needs owner decision) |

## 4. Acceptance criteria (samples, Given/When/Then)
- **Menu filter.** Given the menu has 8 products and 2 are viennoiseries, when the visitor taps "Viennoiseries", then exactly 2 cards show, the chip is pressed, and the URL contains `?cat=viennoiseries`.
- **Contact validation.** Given an empty form, when the visitor submits, then three translated errors show and focus is on the name field.
- **Honeypot.** Given a request with `hp_trap` filled, when it reaches the API, then the response is 200 and neither the store nor the notifier is called.
- **Unconfigured production.** Given production with no store or notifier configured, when a valid message arrives, then the API answers 503 `not_configured`.
- **Pickup slots (c).** Given opening hours 06:30 to 22:30 and a 60 minute lead time, when it is 21:45 and the customer picks today, then no slot after 22:30 is offered and the first slot is at least 60 minutes ahead.
- **Server pricing (c).** Given a tampered cart total, when the order is posted, then the stored total equals the server's recomputation.

## 5. Error handling
| Situation | Behaviour |
|---|---|
| Invalid field | 400 with a translation key per field; UI shows translated text |
| Wrong content type / bad JSON / too large | 415 / 400 / 413 |
| Rate limited | 429 with Retry-After; UI shows a wait message |
| Captcha failed | 403; UI shows a generic send error |
| All delivery channels fail | 502; UI offers retry or phone |
| Nothing configured (production) | 503, logged server-side |
| One of several channels fails | Success, failure logged without content |

## 6. Known risks
0. The shop, cart, orders and admin run in demo mode (browser storage only). Nothing a customer orders reaches the bakery until the real back end exists; the launch build refuses to run with demo mode on.
1. The rate limiter is per server instance and trusts `X-Forwarded-For`; Turnstile is the real defence. Move to a shared store at deployment.
2. Personal data (name, email, phone, message, IP) is stored with no retention policy yet.
3. Story content and all product prices, descriptions and photos await owner input.

## 7. Implementation checklist
- [x] (a) Scaffold, design system, data layer, i18n skeleton, contrast and placeholder checks
- [x] (b) Home, Menu, Product detail, Story, Contact + API, tests, reviews
- [x] (c) Cart, checkout, orders, confirmation, WhatsApp message, admin v1 (demo mode)
- [x] (d) Cake Studio, Box Builder, Gifts, Occasions, Fresh board
- [x] (e) CSP, SEO/JSON-LD, sitemap/robots, accessibility audit, Lighthouse, e2e suites, CI, README
- [ ] Real back end (Supabase orders, server-side admin auth, Resend, Notion), then turn demo mode off, deploy
