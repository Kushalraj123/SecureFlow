# 🛡️ SecureFlow — Fast & Secure Online Transaction Authentication

> **AI-Inspired Adaptive Transaction Authentication & Real-Time Fraud Detection Platform**  
> *Demonstrating Frictionless Approvals, Step-Up OTP Challenges, and Deterministic Fraud Blocks.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Node.js-Express%204-green.svg)](https://expressjs.com/)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57.svg)](https://sqlite.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-Cyber%20Dark-38bdf8.svg)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-10%20passed-brightgreen.svg)]()

---

## 📌 Executive Summary

**SecureFlow** (AegisGuard Engine) is an adaptive risk-based authentication (RBA) web platform. Rather than subjecting every e-commerce customer to disruptive two-factor authentication (2FA) or relying on coarse binary blocking rules, SecureFlow continuously ingests multi-dimensional non-invasive telemetry signals to calculate a deterministic risk score from **0 to 100**.

### 🎯 Core Decision Thresholds

| Risk Score Band | Decision | Authentication Flow | Customer Experience |
| :--- | :---: | :--- | :--- |
| **0 – 29** | **ALLOW** | Frictionless 1-Click Approval | Zero interruption for verified authentic users |
| **30 – 74** | **CHALLENGE** | Step-Up 2FA OTP Required | 6-digit cryptographic verification challenge |
| **75 – 100** | **BLOCK** | Immediate Transaction Rejection | Automated attack terminated with zero bypass |

---

## 🚀 Key Features

1. **Deterministic Scoring Engine**: Identical input signals strictly produce identical scores, rule evaluations, and decisions. Zero black-box unpredictability.
2. **Silent Telemetry Sensor Stream**: Ingests passive behavioral biometrics (cursor trajectory entropy, dwell reading time, paste buffer injection, keystroke cadence) and network integrity signals (IP reputation, geographic impossible travel).
3. **Live Server-Sent Events (SSE)**: Streams transaction events in real-time to the analyst Risk Operations Console without polling.
4. **Short-Lived OTP Challenge Lifecycle**: Cryptographically secure 6-digit OTPs hashed with SHA-256, constant-time verification comparison, expiration timers (5 minutes), and strict 3-attempt locking.
5. **Interactive Judge Sandbox**: Live sliders and switches for all 9 telemetry signals with sub-100ms non-persisted preview scoring and explicit simulation recording.
6. **SQLite High-Concurrency Storage**: Configured with SQLite Write-Ahead Logging (`WAL` mode) and indexes for fast concurrent writes and reads.

---

## 🏗️ Architecture & Project Structure

```
SecureFlow/
├── client/                     # Frontend (React 19 + Vite + TypeScript + Tailwind CSS)
│   ├── src/
│   │   ├── components/         # Reusable UI (ScoreGauge, SignalTelemetryStream, OtpModal, etc.)
│   │   ├── pages/              # LandingPage, CheckoutSimulatorPage, RiskConsolePage, JudgeSandboxPage
│   │   ├── services/           # api.ts (REST client), sse.ts (reconnecting SSE manager)
│   │   ├── types/              # Comprehensive TypeScript interfaces
│   │   ├── App.tsx             # Root router & global real-time toast listener
│   │   ├── index.css           # Cyber grid animation, glassmorphism, glowing borders
│   │   └── main.tsx            # React DOM mounting
│   ├── tailwind.config.js      # Cybersecurity dark theme palette
│   └── vite.config.ts          # Vite configuration with proxy to :5000
│
├── server/                     # Backend (Node.js + Express + SQLite + Zod)
│   ├── src/
│   │   ├── config/             # rules.config.ts (central rule weights, thresholds, personas)
│   │   ├── db/                 # database.ts (SQLite WAL mode, schema initialization, seed data)
│   │   ├── engine/             # riskEngine.ts (deterministic rules, clamping, explanation generator)
│   │   ├── routes/             # REST APIs (transactions, auth, analytics, sse event stream)
│   │   ├── schemas/            # transaction.schema.ts (Zod validation schemas)
│   │   ├── services/           # otp.service.ts, sse.service.ts
│   │   ├── tests/              # engine.test.ts, api.test.ts (Automated Node 22 test suite)
│   │   ├── app.ts              # Express application with security headers & rate limiter
│   │   └── index.ts            # Server entry point listening on PORT 5000
│   └── tsconfig.json           # NodeNext TypeScript configuration
│
├── .env.example                # Environment variable configuration template
├── package.json                # Root orchestration scripts
└── README.md                   # Complete system documentation
```

---

## ⚖️ Deterministic Scoring Ruleset

| Rule Code | Category | Weight | Trigger Condition |
| :--- | :---: | :---: | :--- |
| `RULE_TRUSTED_DEVICE` | Hardware | **-15** | Verified cryptographic device token present |
| `RULE_NEW_DEVICE` | Hardware | **+15** | Unrecognized canvas/browser hardware signature |
| `RULE_BLACKLISTED_IP` | Network | **+40** | IP matched against Tor exit nodes / threat lists |
| `RULE_SUSPICIOUS_IP` | Network | **+20** | Originates from commercial datacenter or VPN |
| `RULE_IMPOSSIBLE_TRAVEL` | Network | **+35** | Physical transit speed between txs exceeds physics |
| `RULE_LOW_MOUSE_ENTROPY` | Behavior | **+20** | Cursor trajectory entropy $\le$ 0.20 (linear/bot) |
| `RULE_FAST_SUBMISSION` | Behavior | **+20** | Form dwell time $<$ 1.00s (inhuman speed) |
| `RULE_NORMAL_DWELL` | Behavior | **-10** | Cognitive dwell time $\ge$ 2.00s (natural human) |
| `RULE_PASTE_DETECTED` | Behavior | **+15** | Direct clipboard injection into checkout fields |
| `RULE_BOT_TYPING` | Behavior | **+15** | Zero standard deviation in keystroke intervals |
| `RULE_NORMAL_TYPING` | Behavior | **-5** | Authentic human variance in typing cadence |
| `RULE_HIGH_VELOCITY` | Velocity | **+20** | Multiple authorization attempts in 5-min window |
| `RULE_BURST_VELOCITY` | Velocity | **+30** | Rapid-fire automated card-testing burst |

*Scores are strictly clamped: $\text{Final Score} = \max(0, \min(100, \text{Raw Score}))$.*

---

## 👥 Predefined Demo Personas

### Persona A: Returning Customer
- **Signals**: Trusted hardware (`-15`), clean residential IP (`0`), normal dwell time 4.8s (`-10`), natural human typing (`-5`).
- **Net Score**: Clamped to **0 / 100**
- **Decision**: **ALLOW** (Frictionless checkout)

### Persona B: Suspicious VPN Hop
- **Signals**: Unrecognized device (`+15`), commercial VPN IP (`+20`), impossible geographic velocity (`+35`), normal dwell time (`-10`).
- **Net Score**: **60 / 100**
- **Decision**: **CHALLENGE** (Triggers Step-up 2FA OTP)

### Persona C: Credential-Stuffing Bot
- **Signals**: Blacklisted Tor IP (`+40`), impossible travel (`+35`), card-testing burst (`+30`), zero cursor jitter (`+20`), sub-second form dwell (`+20`), paste injection (`+15`).
- **Net Score**: Clamped to **100 / 100**
- **Decision**: **BLOCK** (Immediate termination)

---

## 🛠️ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v22.x recommended)
- **npm**: v9.0.0 or higher

### 1. Installation
Install root, server, and client dependencies:
```bash
# In the project root:
npm run install:all
```
*(Or navigate to `server` and `client` and run `npm install` in each).*

### 2. Run Automated Test Suite
Verify risk scoring boundaries, clamping, persona classifications, and OTP lifecycles:
```bash
npm run test
```
*Runs 10 automated unit and integration tests with 100% pass rate.*

### 3. Start Development Server
Launch both the Express backend (:5000) and Vite frontend (:3000) concurrently:
```bash
npm run dev
```

Open your browser at: **[http://localhost:3000](http://localhost:3000)**

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/transactions/score` | Evaluate signals in real-time (preview without database write) |
| `POST` | `/api/transactions` | Execute and record transaction, evaluate score, issue challenge |
| `GET` | `/api/transactions` | Paginated transaction ledger with search and decision filters |
| `GET` | `/api/transactions/:id` | Full transaction forensics, signal breakdown, and audit ledger |
| `POST` | `/api/auth/verify-otp` | Verify 6-digit challenge OTP with attempt locking and expiration |
| `POST` | `/api/auth/resend-otp` | Generate fresh short-lived OTP challenge |
| `GET` | `/api/analytics/summary` | High-level operations KPIs (volumes, approval rate, avg score) |
| `GET` | `/api/analytics/risk-distribution` | Histogram buckets, decision breakdown, top triggered indicators |
| `GET` | `/api/events/stream` | Server-Sent Events (SSE) live connection endpoint |

---

## 🔒 Security & Academic Demonstration Notice

- **No Real Payments**: The platform operates in a simulated demonstration sandbox.
- **Synthetic Tokens**: Credit cards are represented as synthetic tokens (`•••• 8829`). No Primary Account Numbers (PANs), CVVs, or cardholder credentials are collected or stored.
- **Demonstration OTPs**: In local demo mode, a clearly labeled evaluator quick-fill chip displays the generated 6-digit OTP so judges can seamlessly test both approved verification and invalid attempt lockouts.

---

## 🎓 Technical Evaluation Highlights

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Framer Motion, Lucide Icons, Canvas-Confetti.
- **Backend**: Node.js, Express, Better-SQLite3 (WAL mode), Zod validation, Server-Sent Events (SSE), Crypto (SHA-256).
- **Architecture**: Modular separation between Risk Engine, Controllers, Services, and UI layers.
