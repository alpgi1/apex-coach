# Apex Coach

![Status](https://img.shields.io/badge/status-in%20progress-yellow) ![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue)

> An offline-first, RPE-driven training app for serious weightlifters who track every set with precision.

---

## Motivation

Most fitness apps get progressive overload wrong. Fitbod recommends weights based on muscle recovery estimations with no user input. Strong is just a digital notebook. None of them answer the real question:

**"Given how hard I worked last session, what should I lift today?"**

Apex Coach is built around RPE (Rate of Perceived Exertion) — the only metric that captures both absolute load and relative fatigue. Every progression suggestion is derived from the user's own performance data, not generic algorithms.

---

## Core Features

| Feature | Description |
|---|---|
| **RPE Tracking** | Log RPE (1–10) per set. Half-point precision (e.g. 7.5, 8.5) |
| **Progressive Overload Engine** | Analyzes last 3–6 sessions per lift. Suggests weight/reps for next session based on RPE trend |
| **Workout Templates** | Create reusable session blueprints with target sets, rep ranges, and RPE goals |
| **Personal Records** | Auto-tracked PRs: max weight, estimated 1RM (Epley formula), max session volume |
| **AI Coach (stub)** | Hook architecture ready — currently runs local algorithm, replaces with LLM API call in v2 |
| **Offline-First** | Full functionality with zero network connection. SQLite as local source of truth |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo Go |
| Language | TypeScript (strict, no `any`) |
| Styling | NativeWind (Tailwind CSS) |
| Local Database | SQLite via `expo-sqlite` |
| State Management | Zustand |
| Navigation | Expo Router (file-based) |
| Future Backend | Java 21 (Spring Boot) + PostgreSQL |

---

## Project Structure

```
apex-coach/
├── app/                    # Expo Router — file-based navigation
│   ├── (tabs)/             # Tab screens: Dashboard, Workout, History
│   └── workout/[sessionId] # Dynamic session detail route
│
└── src/
    ├── components/
    │   ├── ui/             # Atomic primitives: Button, Card, Badge
    │   ├── workout/        # Domain components: RPESelector, SetLogger, ExerciseCard
    │   └── layout/         # ScreenWrapper
    ├── hooks/              # Business logic: useWorkoutSession, useProgressiveOverload
    ├── services/
    │   ├── storage/        # SQLite CRUD: workoutStorage, exerciseStorage, database
    │   └── api/            # Axios client — points to Spring Boot (future)
    ├── store/              # Zustand: workoutStore, userStore
    ├── types/              # Strict interfaces: exercise, workout, api
    └── utils/              # Pure functions: rpeCalculator, progressionLogic
```

---

## Getting Started

**Prerequisites:** Node.js 18+, Expo Go app on your device or simulator.

```bash
# Clone the repo
git clone https://github.com/alpgi1/apex-coach.git
cd apex-coach

# Install dependencies
npm install

# Start the dev server
npx expo start
```

Scan the QR code with Expo Go (iOS) or the Camera app (Android).

---

## Roadmap

```
Phase 1 — Frontend MVP (current)
  ✅ Type system and data contracts
  ✅ SQLite schema and storage layer
  ⏳ Zustand state management
  ⏳ Core UI components (RPESelector, SetLogger)
  ⏳ Dashboard, Workout, History screens
  ⏳ Progressive overload algorithm

Phase 2 — Backend Integration
  ☐ Java 21 Spring Boot REST API
  ☐ PostgreSQL schema (mirrors SQLite)
  ☐ Offline sync with conflict resolution
  ☐ JWT authentication

Phase 3 — AI Coach
  ☐ LLM integration via Spring Boot
  ☐ Natural language rationale for progression suggestions
  ☐ Fatigue pattern detection across training blocks
```

---

## Data Flow

```
User logs set → RPESelector UI → useWorkoutSession hook
  → workoutStorage (SQLite INSERT)
  → Zustand store update
  → UI re-renders

[Phase 2] → workoutApi.ts → Spring Boot sync → PostgreSQL
```

---

*Built for lifters who take their training seriously.*
