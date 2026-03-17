# Apex Coach

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-orange) ![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue)

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
| Charts | react-native-gifted-charts + react-native-svg (custom radar chart) |
| Future Backend | Java 21 (Spring Boot) + PostgreSQL |

---

## Project Structure

```
apex-coach/
├── app/                        # Expo Router — file-based navigation
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab bar (BlurView glass, active icon glow)
│   │   ├── index.tsx           # Dashboard — last workout, recent sessions, start button
│   │   ├── workout.tsx         # Active workout — timer, set editor, progressive overload
│   │   ├── analyse.tsx         # Analyse tab — volume trend, muscle group split, history
│   │   ├── profile.tsx         # Profile — name, photo, preferences, templates
│   │   └── records.tsx         # Personal records — Est. 1RM (Epley), best set per exercise
│   ├── workout/[sessionId].tsx # Session detail view
│   └── template/
│       ├── create.tsx          # Create workout template
│       └── [templateId].tsx    # Edit template
│
└── src/
    ├── components/
    │   ├── workout/            # ExercisePickerModal, StartWorkoutModal, RPESelector, ExerciseCard, CollapsedExerciseCard
    │   ├── charts/             # SpiderChart (SVG radar), VolumeBarChart (gifted-charts)
    │   └── layout/             # AnimatedBackground (reusable mesh gradient), OnboardingModal
    ├── hooks/                  # useWorkoutSession, useProgressiveOverload
    ├── services/
    │   ├── storage/            # SQLite CRUD: workoutStorage, exerciseStorage, templateStorage, database
    │   ├── analytics/          # computeAnalytics.ts — pure functions: weekly volume, muscle group split
    │   └── api/                # HTTP client stub — Spring Boot (Phase 2)
    ├── store/                  # Zustand: workoutStore, userStore (persisted via AsyncStorage)
    ├── types/                  # Strict interfaces: exercise.types, workout.types, api.types
    └── utils/                  # Pure functions: rpeCalculator (Epley), progressionLogic, formatters
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
  ✅ Zustand state management
  ✅ Dashboard screen with workout history
  ✅ Active workout screen with inline set editing
  ✅ Training history screen with session detail
  ✅ Session detail screen
  ✅ Progressive overload algorithm (local, rule-based)
  ✅ Exercise library (26 exercises, ideal rep ranges)
  ✅ Profile screen (name, weight unit, target RIR)
  ✅ Onboarding screen (first launch)
  ✅ Workout naming modal with quick select
  ✅ Progression rationale display
  ✅ Target RIR connected to suggestion engine
  ✅ Workout template system (create, edit, delete)
  ✅ Template-based workout start
  ✅ Personal Records screen (Est. 1RM via Epley)
  ✅ Profile photo support
  ✅ RPE drum roll picker (iOS-style scroll picker with snap)
  ✅ Set auto-complete (all 3 values filled → tick fires automatically)
  ✅ Swipe-to-delete sets (react-native-gesture-handler ReanimatedSwipeable)
  ✅ Finish workout confirmation modal (summary + animated BlurView sheet)
  ✅ Redesigned bottom action bar (glass Next / glow Finish buttons)
  ✅ Workout screen list view refactor (collapsed/expanded exercises)
  ✅ Analyse tab — Volume Trend bar chart (8-week, react-native-gifted-charts)
  ✅ Analyse tab — Muscle Group Split spider/radar chart (custom SVG, 6-axis)
  ✅ History merged into Analyse tab (analytics above, history list below)

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
