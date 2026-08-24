# AGENTS.md

Your Next Store — e-commerce app built with Next.js App Router, backed by two self-hosted
services: Medusa for commerce (products, cart, checkout, orders, customer auth) and Payload CMS
for content (blog, legal pages, product reviews, newsletter, contact). There is no third-party
platform — both live in this repo, `medusa/` and `payload/`.

## Commands

```bash
bun dev           # Next.js dev server (port 3000; falls back to the next free port if taken)
bun run dev:all   # docker compose up -d (Postgres + Redis + Medusa + Payload) then bun dev — the common case
bun run build     # Production build
bun start         # Production server
bun run lint      # Biome lint (--write to auto-fix)
bun run format    # Biome format
bun test          # Run tests (bun:test)
tsc --noEmit      # Type check
bun run check     # Everything but the build: biome check + tsc --noEmit + bun test
```

Medusa lives in `medusa/apps/backend` (own package.json, own `npm run dev`, own admin UI at
`http://localhost:9000/app`). Payload lives in `payload/` (own package.json, own `npm run dev`,
own admin UI at `http://localhost:3002/admin`). `bun dev` alone is not enough — both must be
reachable (`MEDUSA_BACKEND_URL`, `PAYLOAD_URL`) or the calls that depend on them fail. Use
`bun run dev:all` to bring up the whole stack via Docker; it's what `docker-compose.yml` mirrors
for the eventual VPS deploy.

First-time setup:
- Medusa: after `docker compose up -d postgres redis`, `cd medusa/apps/backend && npx medusa
  db:migrate`, then create an admin user with `npx medusa user -e you@example.com -p <password>`.
- Payload: its Postgres database (`payload`, separate from Medusa's `medusa` database on the same
  server) is created automatically by `scripts/init-payload-db.sql` on Postgres's first boot.
  Visit `http://localhost:3002/admin` once — Payload's first-run screen creates the initial admin
  user itself, no separate CLI step needed.

## Key Files & Directories

```
app/                          # Pages, layouts, actions (App Router)
components/ui/                # Shadcn UI components (add more with: bunx shadcn add <name>)
components/lexical-renderer.tsx  # Dependency-free renderer for Payload's Lexical rich text
lib/commerce.ts               # Medusa Store API client (products, cart, checkout, customer auth)
lib/payload.ts                # Payload REST client (posts, legal pages, reviews, newsletter, contact)
lib/session.ts                # Reads the signed-in customer from the auth cookie
lib/money.ts                  # Currency formatting (formatMoney)
lib/utils.ts                  # Utilities
medusa/apps/backend/          # Self-hosted Medusa server — own package.json, own admin UI, own migrations
payload/                      # Self-hosted Payload CMS — own package.json, own admin UI, own Next.js app
docker-compose.yml            # Postgres + Redis + Medusa + Payload, mirrors the VPS topology
scripts/init-payload-db.sql   # Creates Payload's separate Postgres database on first container boot
biome.json                    # Lint/format config (excludes medusa/ and payload/ — each has its own setup)
tsconfig.json                 # Type-check config (excludes medusa/ and payload/ — each has its own tsconfig)
bunfig.toml                   # Scopes `bun test` to the root project — medusa/ and payload/ use vitest/playwright
next.config.ts                # Next.js config
```

## Project Patterns

- Use `safe-try` for error handling: `const [error, result] = await try_(...)`
- Format prices with `formatMoney` from `lib/money.ts`
- Use functional array methods (`map`, `filter`, `reduce`), not loops
- No `any` types; rely on type inference; minimal return type annotations
- **Always quote paths** with special characters in shell commands: `rg "term" "app/(auth)/login"`
- `/checkout` and `/account` are ordinary same-origin routes — use `<Link>` normally, no special
  handling needed (they used to be proxied to a hosted platform; that's gone).

## Shopper auth

Customer accounts are backed by **Medusa's built-in email/password auth**, not a third-party
platform. `/account/register` and `/account/login` are real local pages backed by Server Actions
in `app/account/actions.ts` (`signUp`, `signIn`, `signOut`), which call `medusa.auth.register` /
`medusa.auth.login` and store the resulting session token in an httpOnly cookie (`yns_auth`, see
`lib/cookies.ts`). `lib/session.ts`'s `getCurrentCustomer()` reads that cookie and resolves the
customer server-side — use it to gate any page or check that needs to know who's signed in.

The Medusa SDK client in `lib/commerce.ts` is configured with `jwtTokenStorageMethod: "nostore"`:
Server Components/Actions have no persistent client-side storage, so every authenticated call
(`orderList`, `customerGet`, etc.) must be passed the token explicitly via `authHeaders(token)`.

## Checkout

`app/checkout/` is a single-page, step-based flow (address → shipping → review/pay) backed by
Server Actions in `app/checkout/actions.ts`, calling Medusa's Store API directly: `cart.update`
(email + addresses) → `fulfillment.listCartOptions` + `cart.addShippingMethod` →
`payment.initiatePaymentSession` (currently the manual `pp_system_default` provider — swap to a
real provider like Stripe by changing the `provider_id` and enabling it on the region, no flow
change needed) → `cart.complete`. `cart.complete`'s response is a discriminated union
(`type: "order"` vs `type: "cart"` with an `error`) — branch on `result.type`, don't assume
success.

After a successful order, call the cart context's `clearCart()` (see `app/cart/cart-context.tsx`)
before navigating away — the cart cookie is cleared server-side by `placeOrder`, but the client's
in-memory cart state needs to be told explicitly or it keeps showing the just-completed cart.

## The prerendered shell

`cacheComponents` is on. Everything the root layout awaits before rendering the chrome ends up in the prerendered shell; anything request-time (`cookies()`, `headers()`, `searchParams`) takes it back out. So `app/layout.tsx` awaits **only cached reads**, and the two per-customer reads — the cart cookie and (on `/account`) the auth cookie — stay inside their own Suspense boundaries *below* the header and footer, never awaited directly in the layout.

Do not hoist a request-time read above the chrome. The layout's Suspense boundaries have no fallback, so the cost is not a spinner: the shell prerenders empty and the page paints blank white until the server responds. That stays invisible during soft navigation (the old UI remains on screen) and is glaring on any full document load.

Check it after touching the layout — the header must be in the prerendered HTML, not only in a streamed chunk:

```bash
bun run build && grep -c '<header' .next/server/app/index.html   # must be ≥ 1
```

## Biome Rules

Avoid: default exports, `any`, `for...of`, `forEach` for mutations, missing hook deps, unnecessary type annotations, function names ending with "Action" (unless server action).

Default export exceptions (Biome-allowed): `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.

Prefer: named exports, `map`/`filter`/`reduce`, type inference, `as const`, template literals.

`medusa/` and `payload/` are excluded from the root Biome/tsconfig/bunfig — each is a separate
project with its own lint, type-check, and test setup (both scaffolders generate their own
`eslint.config.ts`/`tsconfig.json`; Payload also brings vitest and Playwright). Run their checks
from inside `medusa/apps/backend` or `payload/` respectively if you touch files there — and if
you `cd` into either for a fix, `cd` back before running the root project's checks, or you'll get
false failures from the wrong project's config.

## Medusa Store API

`lib/commerce.ts` wraps `@medusajs/js-sdk` (`medusa.store.*`). Every browse/get call resolves the
store's single region first (`getDefaultRegionId()`, memoized) since Medusa prices and carts are
region-scoped — there's no implicit "default" the way a single-tenant store might assume.

```tsx
// Product browsing
const { data: products } = await productBrowse({ limit: 12, offset: 0, q: "query" });

// Product details (accepts a Medusa product id or a handle/slug)
const product = await productGet({ idOrSlug: "t-shirt" });
// product.variants[].calculated_price.calculated_amount — a number in the region's currency,
// NOT a minor-units string. Zero-decimal currencies (this store uses UGX) have no cents to divide.

// Cart
const cart = await cartUpsert({ cartId, variantId: "variant_123", quantity: 1 });
const cart = await cartGet({ cartId }); // returns Medusa's raw StoreCart

// The cart-UI layer (cart-context.tsx, cart-sidebar.tsx, cart-item.tsx) doesn't consume the raw
// StoreCart directly — app/cart/cart-math.ts's mapStoreCart() narrows it to a flat
// { id, items: [{ id, quantity, unit_price, variant_id, product_handle, product_title, thumbnail }] }
// shape first. Extend mapStoreCart if the cart UI needs another field, rather than reaching into
// the raw Medusa response from a component.
```

Medusa has no "bundle" primitive and no facets/filters endpoint — `productFilters()` derives
available categories/collections from `categoriesBrowse`/`collectionBrowse` instead; price-bounds
and variant-option faceting aren't implemented.

## Payload CMS

`lib/payload.ts` wraps Payload's REST API (`fetch` against `PAYLOAD_URL/api/<collection>`, cached
via `next: { revalidate: 60 }`) — there's no SDK client the way Medusa has one. Collections live in
`payload/src/collections/`, one file each: `Posts`, `LegalPages`, `Reviews`,
`NewsletterSubscribers`, `ContactMessages`, `RestockNotifications` (collection created, no
storefront UI yet). `SiteSettings` (`payload/src/globals/SiteSettings.ts`) is a global, not a
collection — singleton config (store name/description, favicon, and `showBlogLink`/
`showContactLink` toggles the footer reads to decide whether to link `/blog` and `/contact`).

Rich text fields use Payload's default Lexical editor, stored as JSON. `components/
lexical-renderer.tsx` is a small hand-written renderer (paragraphs, headings, lists, links, basic
formatting) — deliberately not `@payloadcms/richtext-lexical`'s own React converter, to avoid
pulling that dependency into the storefront for a feature set this simple. Extend its `switch` if
an editor produces a node type it doesn't handle yet, rather than reaching for the full package.

```tsx
// Fetching
const { docs: posts } = await postBrowse({ limit: 24 });
const post = await postGet("my-post-slug");            // null if not found
const pages = await legalPageBrowse();                  // only showInFooter: true
const { docs: reviews } = await reviewsBrowse(productId); // only status: "approved"

// Public writes (Server Actions, e.g. app/contact/action.ts) — no auth required, these are
// the collections' `create` access rules (see below)
await contactMessageCreate({ email, subject, message });
await newsletterSubscribe(email, marketingConsent);      // throws DuplicateSubscriberError on repeat
await reviewCreate({ productId, authorName, authorEmail, rating, title, content }); // status: "pending"
```

**Reviews moderation**: `Reviews`' `access.create` is open to everyone (`() => true`) so the
storefront form can submit without auth, but new reviews default to `status: "pending"` and the
public `read` access rule filters to `status: "approved"` only. Approve/reject in the Payload
admin UI (`/admin/collections/reviews`) — there's no in-app moderation queue.

**productId / variantId values are Medusa IDs stored as plain strings** (`Reviews.productId`,
`Posts.featuredProductId`, `RestockNotifications.variantId`) — Payload has no relational link to
Medusa's database, so there's no referential integrity between the two; a review can reference a
product ID that no longer exists in Medusa, and nothing enforces otherwise.

## Code Examples

### Page with caching
```tsx
// app/search/page.tsx
import { productBrowse } from "@/lib/commerce";
import { SearchResults } from "./search-results";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  "use cache";
  const { q } = await searchParams;
  const products = q
    ? await productBrowse({ q, limit: 24 })
    : { data: [] };
  return <SearchResults products={products.data} query={q} />;
}
```

### Error handling
```tsx
import { productGet } from "@/lib/commerce";
import { formatMoney } from "@/lib/money";
import { try_ } from "safe-try";

const [error, product] = await try_(productGet({ idOrSlug: productId }));
if (error || !product) {
  return <div>Product not found</div>;
}
const price = formatMoney({
  amount: product.variants[0]?.calculated_price?.calculated_amount ?? 0,
  currency: "UGX",
  locale: "en-UG",
});
```

### Unit test (bun:test)
```typescript
import { test, expect } from "bun:test";
import { formatMoney } from "@/lib/money";

test("formatMoney handles a zero-decimal currency correctly", () => {
  const result = formatMoney({ amount: 37000, currency: "UGX", locale: "en-UG" });
  expect(result).toBe("USh 37,000");
});
```

## Checks run locally, not in CI

There is no GitHub Actions workflow — the husky `pre-commit` hook is the only automated gate. It
runs `lint-staged`: Biome over the staged files, then `bun tsc --noEmit` and `bun test` whenever a
`.ts`/`.tsx` file is staged. `bun run check` runs the same three by hand.

`bun run build` stays out of both, because prerendering reads live data from the local Medusa and
Payload instances — both must be running (`bun run dev:all`) before you build.

## Validation Checklist

- [ ] `tsc --noEmit` — no type errors
- [ ] `bun run lint` — no lint errors
- [ ] `bun run format` — code formatted
- [ ] `bun test` — tests pass
- [ ] `bun run build` — build succeeds (Medusa and Payload must both be running)
- [ ] `bun run dev:all` — runs without errors, feature works in browser
- [ ] No console errors, images load, responsive layout
- [ ] No hardcoded secrets; env vars set (`.env.local`, `medusa/apps/backend/.env`, `payload/.env`)

Required env: `MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `PAYLOAD_URL` (see
`.env.example`).

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read property 'variants' of undefined` | Product data missing | Use optional chaining (`product?.variants`) |
| `Missing env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Env not loaded | Create `.env.local` from `.env.example`, restart dev server |
| `Method calculatePrices requires currency_code in the pricing context` | A Medusa field expansion (e.g. `*items.variant.calculated_price`) needs pricing context that wasn't supplied | Drop the expansion if the value isn't actually used, or pass `region_id`/currency context |
| `ECONNREFUSED` on any commerce call | Medusa isn't running / Docker containers are down | `docker compose up -d postgres redis`, then `cd medusa/apps/backend && npm run dev` |
| `ECONNREFUSED` / `fetch failed` on any blog/legal/review/newsletter/contact call | Payload isn't running | `docker compose up -d postgres`, then `cd payload && npm run dev` |
| `Payload request failed: 400 ...` on newsletter signup | Duplicate email (unique constraint) | Expected — `lib/payload.ts` turns this into `DuplicateSubscriberError`, handled as a friendly success in `app/newsletter/action.ts`. A raw 400 elsewhere means that handling was bypassed |
| tsc/lint/test failures inside `medusa/` or `payload/` source files when running the **root** commands | You're running the command from inside `medusa/` or `payload/`, not the repo root — their own configs apply, not the root's exclusions | `cd` back to the repo root before running `bun run check` et al. |
| `defaultSort` (or similar) "does not exist" TS error in a Payload collection | Config option misplaced — e.g. `defaultSort` belongs at the collection's top level, not nested under `admin` | Check the field against `payload/node_modules/payload/dist/collections/config/types.d.ts` rather than guessing from memory; Payload's config shape changes between versions |
| `noDefaultExport` | Default export in non-special file | Use named export |
| `BigInt literal syntax` | Using `0n` with ES2020 | Use `BigInt(0)` |

## Agent Workflow Notes

- **Explore agent**: Start with `lib/commerce.ts`, `lib/payload.ts`, `app/layout.tsx`, `app/page.tsx`, `medusa/apps/backend/medusa-config.ts`, `payload/src/payload.config.ts`. Search `"use server"`/`"use cache"` for patterns.
- **Plan agent**: Check existing code first. Map to: routes (`app/`), commerce API (`lib/commerce.ts`), content API (`lib/payload.ts`), UI (`components/ui/`), actions (`actions.ts`). Consider caching and server vs client components.
- **Implementation agent**: Validate with commands above before and after changes. Follow Biome rules, reuse existing UI components.
- **Frontend design**: Use `frontend-design:frontend-design` skill to achieve a distinctive, production-grade frontend experiences.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
