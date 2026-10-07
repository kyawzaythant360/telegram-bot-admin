# MLBB Shop Admin Panel

Web admin panel for the MLBB diamond top-up Telegram bot. It works on phones and desktops, in light and dark mode.

It reads and writes the **same PostgreSQL database as the bot**, so everything stays in sync:

| Area | What you can do |
|---|---|
| **Dashboard** | Revenue today / 7 days / 30 days, revenue-per-day chart, best sellers, latest orders |
| **Orders** | Filter by status, search (order ID, Game ID, name, @username), view the payment screenshot, copy Game ID / Server ID, **approve or reject**, cancel unpaid orders |
| **Packages** | Change prices and names, add, reorder, delete. Live in the bot instantly |
| **Customers** | Everyone who ordered, with order count and total spent; **message a customer through the bot** |

### Approving works both ways
- **Approve or reject on the website:**
  - The customer gets exactly the same Telegram message as when you decide in the bot.
  - Your Telegram admin card loses its buttons, and a note *"APPROVED from the web panel"* is added under it.
- **Approve or reject in Telegram:** the website shows the new status on the next page load.
- **An order can only be decided once.** If you press Approve in both places, the second press says *"already handled"*.

---

## Requirements

- The bot is already running with `DATABASE_URL` pointing at a Postgres database (Neon). The bot creates the tables on its first start.
- A GitHub account and a free [Vercel](https://vercel.com) account.

## 1. Put the code on GitHub

Create an **empty** repository on GitHub (e.g. `telegram-bot-admin`, private is fine), then:

```bash
cd telegram-bot-admin
git remote add origin git@github.com:<your-user>/telegram-bot-admin.git
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → **Import** your `telegram-bot-admin` repository.
2. Leave the framework (Next.js), build command and output settings as they are.
3. Open **Environment Variables** and add these:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the **same** connection string the bot uses on Render |
   | `ADMIN_PASSWORD` | a long password you'll use to sign in |
   | `BOT_TOKEN` | the bot's token (same as Render) |
   | `ADMIN_CHAT_ID` | your Telegram user ID (same as Render) |
   | `SHOP_NAME` | your shop name (same as Render) |
   | `SUPPORT_CONTACT` | same as Render, shown when a payment is rejected |

4. Click **Deploy**. When it finishes, open the URL (e.g. `https://telegram-bot-admin.vercel.app`) and sign in.

The serverless functions run in Singapore (`vercel.json` → `sin1`), close to a Neon database in `ap-southeast-1`. If your Neon database is elsewhere, change the region to match.

**After changing any environment variable on Vercel, redeploy**: Deployments → ⋯ → Redeploy. Vercel only applies new values to new deployments.

## 3. Use it on your phone

Open the URL in Safari or Chrome → **Share → Add to Home Screen**. It opens like an app, with a bottom tab bar.

---

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev                  # http://localhost:3000
```

Other commands: `npm run build` (production build), `npm run lint`.

## Security notes

- Every page, server action and the screenshot route checks the signed session cookie. The cookie is httpOnly, Secure and lasts 7 days.
- Changing `ADMIN_PASSWORD` (and redeploying) signs out every device.
- Wrong passwords are slowed down by about 1 second each.
- Screenshots are streamed through the panel from Telegram. The bot token never reaches the browser.

## How it's built

- Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, `postgres` (postgres.js), lucide icons.
- `src/lib/queries.ts`: all SQL. The tables belong to the bot (`db.py`), so the panel never changes the schema.
- `src/app/actions.ts`: every write (approve/reject, packages, messages).
- `src/lib/messages.ts`: customer-facing Telegram texts, copied from the bot's `texts.py`. If you change the wording in the bot, change it here too.
- `src/app/globals.css`: colour tokens for light and dark mode. All text colours pass WCAG AA contrast.
