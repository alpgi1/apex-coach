# Apex Coach

![Status](https://img.shields.io/badge/status-MVP-brightgreen) ![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey) ![License](https://img.shields.io/badge/license-MIT-blue)

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
| **RPE Tracking** | Log RPE (1-10) per set with half-point precision via iOS-style drum roll picker |
| **Progressive Overload Engine** | Analyzes last 3-6 sessions per lift. Suggests weight/reps based on RPE trend and target RIR |
| **Workout Templates** | Create reusable session blueprints with target sets, rep ranges, and RPE goals |
| **Personal Records** | Auto-tracked PRs: max weight, estimated 1RM (Epley formula), best set per exercise |
| **Analyse Dashboard** | 8-week volume trend chart + muscle group split radar chart |
| **Cloud Sync** | Local-first architecture with automatic backend sync. Works offline, syncs when connected |
| **Auth** | Supabase-powered authentication with session persistence across app restarts |
| **Offline-First** | Full functionality with zero network connection. SQLite as local source of truth |

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React Native + Expo |
| Language | TypeScript |
| Styling | NativeWind (Tailwind CSS) + StyleSheet |
| Local Database | SQLite via `expo-sqlite` |
| State Management | Zustand (persisted via AsyncStorage) |
| Navigation | Expo Router (file-based) |
| Auth | Supabase JS (`@supabase/supabase-js`) |
| Charts | react-native-gifted-charts + react-native-svg |
| Font | Outfit (Google Fonts via `@expo-google-fonts`) |

### Backend

| Layer | Technology |
|---|---|
| Framework | Spring Boot 4.0.3 |
| Language | Java 21 |
| Database | PostgreSQL 17 (Docker local / Supabase prod) |
| ORM | Spring Data JPA + Hibernate 7 |
| Migrations | Flyway |
| Auth | Supabase Auth (JWT) + Spring Security OAuth2 Resource Server |
| Validation | Jakarta Bean Validation |
| Deployment | Render (Docker) |
| Uptime | UptimeRobot (5-min pings to keep free tier alive) |

---

## Architecture

```
┌──────────────────────────┐         ┌──────────────────────────┐
│    React Native App      │  HTTP   │    Spring Boot 4 API     │
│    (Expo / TypeScript)   ├────────►│    (Java 21)             │
│                          │  JSON   │                          │
│  SQLite (local-first)    │◄────────┤  PostgreSQL 17           │
│  Zustand (state)         │         │  (Supabase managed)      │
└──────────┬───────────────┘         └──────────────────────────┘
           │                                    ▲
           │  Auth (JWT)                        │ JWT verification
           ▼                                    │
┌──────────────────────────┐                    │
│       Supabase           ├────────────────────┘
│  - Auth (email/password) │
│  - PostgreSQL (prod DB)  │
│  - Session persistence   │
└──────────────────────────┘
```

### Sync Strategy

Apex Coach uses a **local-first** architecture:

1. All UI screens read from **local SQLite** — zero network latency
2. Writes go to **SQLite immediately**, then fire-and-forget to backend
3. On login, backend data is **pulled and merged** into local SQLite (additive upsert)
4. Works fully offline — backend sync fails silently without blocking UX

```
Write path:  UI → SQLite (immediate) → Backend API (async, non-blocking)
Read path:   UI ← SQLite ← Backend (merged on login)
```

### Backend Architecture

```
com.apexcoach.api
├── config/          # SecurityConfig, CorsConfig
├── controller/      # REST endpoints (@RestController)
├── service/         # Business logic + AuthenticatedUserService
├── repository/      # Spring Data JPA interfaces
├── entity/          # JPA entities + enums
├── dto/             # Request/Response records with validation
└── exception/       # @ControllerAdvice global error handling
```

### API Endpoints

All endpoints (except exercises and health) are user-scoped via JWT.

```
GET    /api/v1/health                   Health check

GET    /api/v1/exercises                List exercises (filterable: name, muscleGroup, equipment)
GET    /api/v1/exercises/{id}           Exercise detail
POST   /api/v1/exercises                Create custom exercise

POST   /api/v1/workouts                 Save workout session (nested: session → logs → sets)
GET    /api/v1/workouts                 History (paginated)
GET    /api/v1/workouts/{id}            Session detail with full set data
DELETE /api/v1/workouts/{id}            Delete session

GET    /api/v1/templates                List templates
POST   /api/v1/templates                Create template
PUT    /api/v1/templates/{id}           Update template
DELETE /api/v1/templates/{id}           Delete template

GET    /api/v1/records/{exerciseId}     Personal record (max weight, est. 1RM via Epley)
```

---

## Project Structure

```
apex-coach/
├── app/                            # Expo Router — file-based navigation
│   ├── _layout.tsx                 # Root layout — auth gate, sync chain, onboarding
│   ├── (auth)/                     # Auth screens (login, signup)
│   │   ├── _layout.tsx
│   │   ├── login.tsx               # Sign in — AnimatedBackground, glassmorphism card
│   │   └── signup.tsx              # Sign up — email/password with validation
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tab bar (BlurView glass, active icon glow)
│   │   ├── index.tsx               # Dashboard — last workout, weekly calendar, start button
│   │   ├── workout.tsx             # Active workout — timer, set editor, progressive overload
│   │   ├── analyse.tsx             # Analyse — volume trend chart, muscle group radar
│   │   └── profile.tsx             # Profile — preferences, templates, stats, sign out
│   ├── records.tsx                 # Personal records — Est. 1RM (Epley), best set per exercise
│   ├── workout/[sessionId].tsx     # Session detail view
│   └── template/
│       ├── create.tsx              # Create workout template
│       └── [templateId].tsx        # Edit template
│
├── src/
│   ├── components/
│   │   ├── workout/                # ExercisePickerModal, StartWorkoutModal, RPESelector, ExerciseCard
│   │   ├── charts/                 # SpiderChart (SVG radar), VolumeBarChart (gifted-charts)
│   │   └── layout/                 # AnimatedBackground (reusable mesh gradient), OnboardingModal
│   ├── hooks/                      # useWorkoutSession, useProgressiveOverload
│   ├── lib/
│   │   └── supabase.ts             # Supabase client singleton (AsyncStorage adapter)
│   ├── services/
│   │   ├── storage/                # SQLite CRUD: workoutStorage, exerciseStorage, templateStorage
│   │   ├── analytics/              # computeAnalytics.ts — weekly volume, muscle group split
│   │   └── api/                    # client.ts (Bearer JWT), workoutApi, templateApi, exerciseApi
│   ├── store/                      # Zustand: workoutStore, userStore, authStore
│   ├── types/                      # Strict interfaces: exercise.types, workout.types
│   └── utils/                      # rpeCalculator (Epley), progressionLogic, formatters
│
├── .env                            # Environment variables (not committed)
│
└── backend/                        # Spring Boot 4 API
    ├── docker-compose.yml          # PostgreSQL 17 + pgAdmin (local dev)
    ├── Dockerfile                  # Production container (Render)
    ├── pom.xml                     # Maven — Spring Boot 4.0.3, Java 21
    └── src/main/
        ├── java/com/apexcoach/api/
        │   ├── config/             # Security, CORS
        │   ├── controller/         # REST controllers
        │   ├── service/            # Business logic
        │   ├── repository/         # JPA repositories
        │   ├── entity/             # JPA entities + enums
        │   ├── dto/                # Request/Response DTOs
        │   └── exception/          # Global exception handler
        └── resources/
            ├── application.yml     # Base config
            ├── application-dev.yml # Local DB (Docker)
            ├── application-prod.yml# Supabase prod (env vars)
            └── db/migration/       # Flyway SQL migrations (V1-V4)
```

---

## Getting Started

### Frontend

**Prerequisites:** Node.js 18+, Expo Go app on your device or simulator.

```bash
git clone https://github.com/alpgi1/apex-coach.git
cd apex-coach
npm install
```

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_BASE_URL=your_backend_url
```

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS) or the Camera app (Android).

### Backend

**Prerequisites:** Java 21+, Docker Desktop.

```bash
cd backend

# Start PostgreSQL
docker compose up -d

# Run the API (dev profile active by default)
./mvnw spring-boot:run

# Health check
curl http://localhost:8080/api/v1/health
```

**pgAdmin:** http://localhost:5050 (admin@apexcoach.com / admin)

---

## Data Flow

```
User logs set → RPESelector (drum roll picker) → useWorkoutSession hook
  → Zustand store update (immediate UI feedback)
  → workoutStorage (SQLite INSERT — local persistence)
  → workoutApi.postWorkout (fire-and-forget → Spring Boot API → PostgreSQL)

On login → exerciseApi.syncExercises (ID reconciliation)
        → workoutApi.fetchWorkouts → upsertWorkoutsFromBackend (SQLite merge)
        → templateApi.fetchTemplates → upsertTemplatesFromBackend (SQLite merge)
```

---

## Roadmap

```
Phase 1 — Frontend MVP
  ✅ Type system and data contracts
  ✅ SQLite schema and storage layer
  ✅ Zustand state management
  ✅ Dashboard screen with workout history + weekly calendar
  ✅ Active workout screen with inline set editing
  ✅ Session detail screen
  ✅ Progressive overload algorithm (local, rule-based)
  ✅ Exercise library (26 exercises, ideal rep ranges)
  ✅ Profile screen (name, weight unit, target RIR, photo)
  ✅ Onboarding screen (first launch)
  ✅ Workout template system (create, edit, delete, start from template)
  ✅ Personal Records screen (Est. 1RM via Epley)
  ✅ RPE drum roll picker (iOS-style scroll picker with snap)
  ✅ Set auto-complete + swipe-to-delete
  ✅ Finish workout confirmation modal (animated BlurView sheet)
  ✅ Analyse tab — Volume Trend bar chart + Muscle Group Split radar
  ✅ UI polish — Outfit font, floating tab bar, card hierarchy, AnimatedBackground

Phase 2 — Backend + Cloud Sync
  ✅ Spring Boot 4.0.3 project scaffold
  ✅ PostgreSQL schema (Flyway V1-V4 — 8 tables + seed data)
  ✅ Docker Compose (PostgreSQL 17 + pgAdmin)
  ✅ Security + CORS + global exception handling
  ✅ JPA entities + repositories
  ✅ Exercise, Workout, Template, Personal Record endpoints
  ✅ DTO validation layer (Jakarta Bean Validation, ApiResponse<T>)
  ✅ Supabase Auth JWT integration (login/signup screens)
  ✅ Render deployment + UptimeRobot keep-alive
  ✅ Exercise ID sync (local SQLite UUID ↔ backend UUID reconciliation)
  ✅ Workout write sync (fire-and-forget POST after local save)
  ✅ Workout read sync (backend → local SQLite merge on login)
  ✅ Template CRUD sync (create → backend, fetch → local merge)
  ✅ Auth gate (session-aware routing, no login flash on restart)
  ✅ Sign out flow

Phase 3 — AI Coach
  ☐ LLM integration via Spring Boot endpoint
  ☐ Natural language rationale for progression suggestions
  ☐ Fatigue pattern detection across training blocks
```

---

*Built for lifters who take their training seriously.*
