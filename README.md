# Retail App

A full-stack retail shopping experience built as two independent packages.

| Package | Tech | Docs |
|---|---|---|
| [`retail-bff`](./retail-bff) | NestJS · TypeScript | [retail-bff/README.md](./retail-bff/README.md) |
| [`retail-app`](./retail-app) | React Native · Expo · TypeScript | [retail-app/README.md](./retail-app/README.md) |

---

## How they fit together

```
retail-app  ──▶ HTTP ──▶  retail-bff  (default: port 3000)
```

The BFF is a self-contained REST API with in-memory state (no database). The app consumes it directly — no authentication layer, no middleware.

---

## Quick start

```bash
# 1. Start the BFF
cd retail-bff && npm install && npm run start:dev

# 2. In a new terminal, start the app
cd retail-app && npm install && npm start
```

See each package's README for full setup, environment config, and test instructions.

---

## CI

Both test suites run on every push and pull request to `main` via GitHub Actions (`.github/workflows/ci.yml`).

## License

This project is licensed under a custom non-commercial license.

❗ Commercial use is prohibited  
❗ Use in AI/ML systems is strictly prohibited without permission
