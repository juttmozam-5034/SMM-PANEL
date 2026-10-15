# SocialBoost – SMM Reseller Panel (Vite + React + Supabase)

Manual-fulfilment SMM reseller panel. Customers fund a PKR wallet (EasyPaisa/JazzCash, **verified manually by an admin**), place orders, and the admin fulfils them manually through an external provider and updates the status here. Nothing is sent to a provider automatically and no payment is verified automatically.

## Stack
React 18, TypeScript, Vite, Tailwind CSS, React Router, Supabase (PostgreSQL, Auth, Row Level Security), Vercel.

## Money model (source of truth)
* `wallet_transactions` is the **append-only ledger** and the source of truth.
* `profiles.balance` is a snapshot, changed only by the internal function `_apply_txn()` in the same transaction as the ledger insert (it locks the row first). Customers have no write grant on balances, and triggers block edits/deletes on the ledger.
* Orders, deposit approval, refunds and admin credit/debit run as `SECURITY DEFINER` SQL functions that check the caller's role, validate inputs and are idempotent:
  * duplicate order submit → same idempotency key returns the existing order
  * one payment / one refund / one deposit credit per order or deposit (unique indexes)
  * the same payment TID cannot be submitted twice (unique index, case-insensitive)
  * cancelled, refunded and partial orders are final, so a refund can happen only once
* Dashboard separates gross order revenue, refunds, net revenue, deposits and customer wallet balances (a liability, not profit).

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   * `VITE_SUPABASE_URL` – Project URL (Supabase → Project Settings → API)
   * `VITE_SUPABASE_PUBLISHABLE_KEY` – publishable (or legacy anon) key
   Never put a service-role/secret key in this app. It is not needed.
3. `npm run dev` → http://localhost:5173

## Supabase setup
Run these in **SQL Editor** in order, once each:
1. `supabase/all_migrations.sql` (schema, functions, RLS, triggers, sample data)
2. `supabase/0005_admin_reports.sql`
3. `supabase/0006_support.sql`
4. `supabase/0007_deposit_limit.sql`

Then **Authentication → URL Configuration**: set *Site URL* to your site and add `https://YOUR-DOMAIN/**` (and `http://localhost:5173/**`) to *Redirect URLs*.

## First admin
No admin password lives in code. Register normally, then in SQL Editor:
```sql
update profiles set role = 'admin' where email = 'you@example.com';
```
Public registration always creates a `customer`; role changes by API users are blocked by column grants and a trigger.

## First-time admin configuration
1. Admin → **Payment Settings**: set EasyPaisa/JazzCash title and number, enable them, set the minimum deposit.
2. Admin → **Categories & Platforms**, then **Manage Services**: replace the `[SAMPLE]` services with real ones and activate them.
3. Admin → **Website Settings**: site name, logo link, support contact, footer links.

## Deploy to Vercel
1. Push the repo to GitHub (never commit `.env.local`).
2. Vercel → New Project → import the repo (framework: Vite).
3. Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Deploy, then add the Vercel URL to Supabase Site URL / Redirect URLs. `vercel.json` rewrites all paths to `index.html`.

## Website assistant (free, no API key)
* The chat widget ("Ask us") is a rule-based assistant that runs in the browser: **no AI service, no API key, no per-message cost**.
* It answers from live data only: active services (price, min/max, delivery), plus the FAQ, refund policy, delivery notes and extra info you write in Admin -> **Bot Knowledge**. It also calculates totals ("250 youtube views"), understands English and Roman Urdu keywords, and otherwise tells the customer to open a support ticket.
* Run `supabase/0008_bot.sql` once. Chats are not stored and the bot cannot see accounts, wallets or orders.
* It matches keywords, so it is not as flexible as an AI model. Add FAQ entries for questions your customers ask often.

## Admin alerts (free, Telegram)
Run `supabase/0009_alerts.sql`, then Admin -> **Admin Alerts**. Database triggers send a Telegram message (through Supabase's built-in pg_net) for new orders, deposit requests and customer support messages. The bot token is stored in a table API users cannot read. An alert failure never blocks an order or deposit.

## Tests
* **Money rules in the database** (the important ones): paste `supabase/tests/financial_rules_test.sql` into the SQL Editor and Run. It ends with an intentional error whose message is the report; every line should say PASS and the last line `RESULT: ALL TESTS PASSED`. All test data is rolled back. It covers: signup role, customer cannot reach admin functions or edit role/balance/ledger/services, admin can add/edit services, valid order, insufficient balance, invalid quantity, price manipulation, duplicate submit, pending deposit does not credit, approval credits once, duplicate TID, rejection, admin credit/debit ledger, blocked users, refunds only once, data isolation, ledger immutability, balance = ledger sum.
* **Unit tests**: `npm test` (price formula and PKR formatting).
* Not automated: browser route guards (a customer opening `/admin/...` is redirected; real protection is RLS + the SQL role checks) and full UI flows. Test those with the checklist below.

## Production checklist
- [ ] All SQL files run, test script shows ALL TESTS PASSED
- [ ] Supabase **Confirm email is ON** (Authentication → Sign In / Providers → Email)
- [ ] Site URL and Redirect URLs point to the production domain
- [ ] Strong password on the admin account; only intended accounts have role `admin`
- [ ] Sample services replaced or deactivated; real payment account details saved
- [ ] No secret keys in GitHub or Vercel variables with `VITE_` prefix
- [ ] Place a real small order, cancel it, check the refund and Wallet History
- [ ] Submit and approve a small deposit; submit the same TID again (must be refused)
- [ ] Block a test customer: orders and deposits must be refused
- [ ] Customer A cannot see customer B's orders/tickets (try with two accounts)
- [ ] Add your own Terms/Privacy pages and link them in Website Settings

## Known limits
Fulfilment and payment verification are manual by design. Rate limiting: Supabase Auth's built-in limits for sign-in/sign-up, plus a cap of 5 pending deposit requests per customer. A "service visibility" toggle and file-upload logos are not implemented (logo is an https link).
