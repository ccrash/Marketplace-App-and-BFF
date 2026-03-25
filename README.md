# Retail App

A full-stack retail shopping experience built as two independent packages.

| Package | Tech | Docs |
|---|---|---|
| [`retail-bff`](./retail-bff) | NestJS · TypeScript | [retail-bff/README.md](./retail-bff/README.md) |
| [`mobile-react-native`](./mobile-react-native) | React Native · Expo · TypeScript | [mobile-react-native/README.md](./mobile-react-native/README.md) |

---

## How they fit together

```
mobile-react-native  ──HTTP──▶  retail-bff  (default: port 3000)
```

The BFF is a self-contained REST API with in-memory state (no database). The app consumes it directly — no authentication layer, no middleware.

---

## Quick start

```bash
# 1. Start the BFF
cd retail-bff && yarn install && yarn start:dev

# 2. In a new terminal, start the app
cd mobile-react-native && yarn install && yarn start
```

See each package's README for full setup, environment config, and test instructions.

---

## CI

Both test suites run on every push and pull request to `main` via GitHub Actions (`.github/workflows/ci.yml`).
