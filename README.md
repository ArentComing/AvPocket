<p align="center">
  <img src="https://img.shields.io/badge/PocketMine--MP-v5-blue?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUg" alt="PMMP v5" />
  <img src="https://img.shields.io/badge/Minecraft-Bedrock-green?style=for-the-badge" alt="Bedrock" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT" />
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TS" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

# AvPocket

> A marketplace, CI builder, and digital asset hub built for the PocketMine-MP community.

If you've ever dealt with the mess of finding trustworthy PMMP plugins, manually building `.phar` files from source, or trying to sell your work without a proper platform — this is what AvPocket tries to fix.

---

## What is this?

AvPocket is a web platform where PocketMine-MP developers can publish, share, and sell their plugins, virions, maps, models, and server setups. Think of it as Poggit meets GitHub meets BuiltByBit, but specifically designed around the PMMP ecosystem.

It's not just a file host. When you upload a plugin or connect your GitHub repo, AvPocket automatically:
- Parses your `plugin.yml` and extracts metadata (API version, commands, permissions, dependencies)
- Scans your PHP code for backdoors, token stealers, obfuscated payloads, and suspicious webhook calls
- Builds a production-ready `.phar` from source with virion injection
- Generates a product page with documentation, changelogs, reviews, and issue tracking

---

## Features

### Marketplace & Asset Hub
- Support for plugins (`.phar`/source), virions, maps, Blockbench models, and full server bundles
- Free and premium listings with configurable pricing
- Star ratings and reviews from the community
- Lightweight issue tracker per asset (open/closed, just like GitHub Issues but simpler)
- Developer profiles with download stats and published assets
- Download counter and direct file streaming

### Plugin Inspector & Security Scanner
- Automatic `plugin.yml` parsing on upload — no need to fill forms manually
- Anti-backdoor engine that catches `eval()`, `shell_exec()`, base64-obfuscated payloads, and Discord webhook exfiltration attempts
- Security score (0-100) shown on every product page
- Supports both `.phar` and `.zip` uploads

### Automated CI (Poggit-style)
- Connect your GitHub repo and push a tag → AvPocket builds the `.phar` for you
- Webhook listener for `push` and `release` events with SHA256 signature verification
- Built-in virion injector: declare dependencies in `plugin.yml` and they get bundled into the final phar automatically
- Three release channels: **Stable**, **Beta**, **Dev**
- Build logs stored and viewable from the product page
- Manual build trigger from the dashboard

### Wallet & Monetization
- User wallet system with deposit and transaction history
- 90/10 revenue split — developers keep 90% of every sale
- Instant purchase flow with license key generation
- Full purchase history and license management dashboard

### DRM & License Verification
- Every premium purchase generates a unique key (`AVP-XXXX-XXXX-XXXX-XXXX`)
- Public REST API at `/api/v1/license/verify` for server-side validation
- Logs server IP, port, and PMMP version on each verification call
- Drop-in PHP trait included — just copy it into your plugin and call `checkLicense()` in `onEnable()`

```php
// Example usage in your PocketMine plugin:
use AvPocket\PocketMineLicenseCheckTrait;

class Main extends PluginBase {
    use PocketMineLicenseCheckTrait;
    
    public function onEnable(): void {
        $key = $this->getConfig()->get("license-key");
        if (!$this->checkLicense($key)) {
            $this->getServer()->shutdown();
        }
    }
}
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Backend | Next.js API Routes (Node.js), TypeScript |
| Database | PostgreSQL (prod) via Prisma ORM |
| CI Engine | PHP 8.x phar compiler + custom virion injector |
| Auth | JWT + bcrypt |
| Deployment | Docker, Nginx reverse proxy, Let's Encrypt SSL |
| Cache/Queue | Redis 7 |

---

## Project Structure

```
├── src/
│   ├── app/                    # Next.js pages & API routes
│   │   ├── api/
│   │   │   ├── auth/           # register, login, me
│   │   │   ├── assets/         # CRUD, download, reviews, issues, purchase
│   │   │   ├── ci/             # webhook, manual-build
│   │   │   ├── v1/license/     # DRM verification endpoint
│   │   │   ├── virions/        # virion registry
│   │   │   ├── wallet/         # deposit, transactions
│   │   │   └── upload/         # inspect & create
│   │   ├── assets/[slug]/      # product showcase page
│   │   ├── users/[username]/   # developer profile
│   │   ├── upload/             # drag-and-drop upload page
│   │   ├── wallet/             # wallet dashboard
│   │   └── my-purchases/       # license management
│   ├── components/             # Navbar, Footer, shared UI
│   ├── lib/
│   │   ├── ci/                 # CI build pipeline engine
│   │   └── pocketmine/         # inspector, security scanner, virion injector
│   ├── scripts/
│   │   ├── phar-builder.php    # standalone phar compiler
│   │   └── phar-helper.php     # phar metadata extractor
│   └── examples/
│       └── PocketMineLicenseCheckTrait.php
├── prisma/
│   ├── schema.prisma           # full data model
│   └── seed.ts                 # sample data seeder
├── nginx/
│   └── nginx.conf              # production reverse proxy config
├── scripts/
│   └── backup.sh               # automated DB + uploads backup
├── tests/                      # automated test suites
├── Dockerfile                  # multi-stage production build
├── docker-compose.yml          # full stack (PG + Redis + App + Nginx)
└── deploy.sh                   # one-command deployment script
```

---

## Getting Started

### Local Development

```bash
git clone https://github.com/ArentComing/AvPocket.git
cd AvPocket

npm install

# set up local env (uses SQLite for dev)
cp .env.example .env

# push schema to local database
npx prisma db push
npx prisma db seed

npm run dev
# → http://localhost:3000
```

### Production Deployment

Tested on Ubuntu 22.04+ with Docker and Docker Compose v2.

```bash
git clone https://github.com/ArentComing/AvPocket.git
cd AvPocket

# configure production secrets
cp .env.production.example .env.production
nano .env.production

# deploy everything
chmod +x deploy.sh scripts/backup.sh
./deploy.sh
```

This will:
1. Check for Docker and Docker Compose
2. Obtain SSL certificates via Let's Encrypt (if not already present)
3. Build the Docker image
4. Start PostgreSQL, Redis, the app, worker, and Nginx
5. Run database migrations and seed
6. Set up daily backup cron (3 AM) and SSL auto-renewal

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Get JWT token |
| `GET` | `/api/auth/me` | Current user profile |
| `GET` | `/api/assets` | Browse catalog |
| `POST` | `/api/assets/create` | Publish new asset |
| `GET` | `/api/assets/:slug` | Asset details |
| `GET` | `/api/assets/:slug/download` | Download file |
| `POST` | `/api/assets/:slug/reviews` | Submit review |
| `POST` | `/api/assets/:slug/issues` | Report issue |
| `POST` | `/api/assets/:slug/purchase` | Buy premium asset |
| `POST` | `/api/upload/inspect` | Inspect .phar/.zip |
| `POST` | `/api/ci/webhook` | GitHub webhook receiver |
| `POST` | `/api/ci/manual-build` | Trigger manual CI build |
| `POST/GET` | `/api/v1/license/verify` | Verify license key |
| `POST` | `/api/wallet/deposit` | Add funds |
| `GET` | `/api/wallet/transactions` | Transaction history |
| `GET` | `/api/virions` | List available virions |

---

## Backups

Automated daily backups run at 3 AM (server time) and include:
- Full PostgreSQL database dump (gzipped)
- All uploaded files archive

Backups older than 14 days are automatically cleaned up. You can also run a manual backup:

```bash
./scripts/backup.sh
```

---

## Contributing

Pull requests are welcome. If you're planning something big, open an issue first so we can discuss it.

For bugs and feature requests, use the [Issues](https://github.com/ArentComing/AvPocket/issues) tab.

---

## License

MIT — see [LICENSE](LICENSE) for details.
