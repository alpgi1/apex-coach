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

### Frontend

| Layer | Technology |
|---|---|
| Framework | React Native + Expo Go |
| Language | TypeScript (strict, no `any`) |
| Styling | NativeWind (Tailwind CSS) |
| Local Database | SQLite via `expo-sqlite` |
| State Management | Zustand |
| Navigation | Expo Router (file-based) |
| Charts | react-native-gifted-charts + react-native-svg (custom radar chart) |
| Font | Outfit (Google Fonts) |

### Backend

| Layer | Technology |
|---|---|
| Framework | Spring Boot 4.0.3 |
| Language | Java 21 |
| Database | PostgreSQL 17 (Docker local / Supabase prod) |
| ORM | Spring Data JPA + Hibernate 7 |
| Migrations | Flyway |
| Auth | Supabase Auth (JWT) + Spring Security |
| Validation | Jakarta Bean Validation |
| Deployment | Railway (Docker) |

---

## Architecture

```
┌──────────────────────┐        ┌──────────────────────┐
│   React Native App   │  HTTP  │  Spring Boot 4 API   │
│   (Expo / TypeScript)├───────►│  (Java 21)           │
│                      │  JSON  │                      │
│  SQLite (offline)    │◄───────┤  PostgreSQL 17       │
└──────────────────────┘        └──────────┬───────────┘
                                           │
                                ┌──────────▼───────────┐
                                │   Supabase           │
                                │   - Auth (JWT)       │
                                │   - PostgreSQL (prod)│
                                └──────────────────────┘
```

### Backend Architecture

```
com.apexcoach.api
├── config/          # SecurityConfig, CorsConfig
├── controller/      # REST endpoints (@RestController)
├── service/         # Business logic
├── repository/      # Spring Data JPA interfaces
├── entity/          # JPA entities + enums
├── dto/             # Request/Response records + validation
├── dto/             # Request/Response records with static from() factories
└── exception/       # @ControllerAdvice global error handling
```

### API Endpoints

```
POST   /api/v1/auth/register         Create user profile
GET    /api/v1/users/me               Get own profile
PUT    /api/v1/users/me               Update profile

GET    /api/v1/exercises               List exercises
GET    /api/v1/exercises/{id}          Exercise detail
POST   /api/v1/exercises               Create custom exercise

POST   /api/v1/workouts                Save workout session
GET    /api/v1/workouts                History (paginated)
GET    /api/v1/workouts/{id}           Session detail
DELETE /api/v1/workouts/{id}           Delete session

GET    /api/v1/templates               List templates
POST   /api/v1/templates               Create template
PUT    /api/v1/templates/{id}          Update template
DELETE /api/v1/templates/{id}          Delete template

GET    /api/v1/records/{exerciseId}    Personal record
```

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
├── src/
│   ├── components/
│   │   ├── workout/            # ExercisePickerModal, StartWorkoutModal, RPESelector, ExerciseCard
│   │   ├── charts/             # SpiderChart (SVG radar), VolumeBarChart (gifted-charts)
│   │   └── layout/             # AnimatedBackground (reusable mesh gradient), OnboardingModal
│   ├── hooks/                  # useWorkoutSession, useProgressiveOverload
│   ├── services/
│   │   ├── storage/            # SQLite CRUD: workoutStorage, exerciseStorage, templateStorage
│   │   ├── analytics/          # computeAnalytics.ts — weekly volume, muscle group split
│   │   └── api/                # HTTP client stub — Spring Boot (Phase 2)
│   ├── store/                  # Zustand: workoutStore, userStore (persisted via AsyncStorage)
│   ├── types/                  # Strict interfaces: exercise.types, workout.types, api.types
│   └── utils/                  # rpeCalculator (Epley), progressionLogic, formatters
│
└── backend/                    # Spring Boot 4 API
    ├── docker-compose.yml      # PostgreSQL 17 + pgAdmin (local dev)
    ├── Dockerfile              # Production container (Railway)
    ├── pom.xml                 # Maven — Spring Boot 4.0.3, Java 21
    └── src/main/
        ├── java/com/apexcoach/api/
        │   ├── config/         # Security, CORS
        │   ├── controller/     # REST controllers
        │   ├── service/        # Business logic
        │   ├── repository/     # JPA repositories
        │   ├── entity/         # JPA entities + enums
        │   ├── dto/            # Request/Response DTOs
        │   ├── dto/            # Request/Response records with static from() factories
        │   └── exception/      # Global exception handler
        └── resources/
            ├── application.yml          # Base config
            ├── application-dev.yml      # Local DB (Docker)
            ├── application-prod.yml     # Supabase (env vars)
            └── db/migration/            # Flyway SQL migrations
```

---

## Getting Started

### Frontend

**Prerequisites:** Node.js 18+, Expo Go app on your device or simulator.

```bash
git clone https://github.com/alpgi1/apex-coach.git
cd apex-coach
npm install
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
  ✅ Analyse tab — Volume Trend bar chart + Muscle Group Split radar chart
  ✅ UI polish — Outfit font, floating tab bar, card hierarchy, animations

Phase 2 — Backend Integration (in progress)
  ✅ Spring Boot 4.0.3 project scaffold
  ✅ PostgreSQL schema (Flyway V1–V4 — 8 tables + seed data + casts + dev user)
  ✅ Docker Compose (PostgreSQL 17 + pgAdmin)
  ✅ Security + CORS + global exception handling
  ✅ JPA entities + repositories (WorkoutSession, ExerciseLog, WorkoutSet, Exercise, User, ...)
  ✅ Exercise CRUD — GET (filter by name/muscleGroup/equipment), GET /{id}, POST custom
  ✅ DTO validation layer (Jakarta Bean Validation, @ControllerAdvice, ApiResponse<T>)
  ✅ Workout CRUD — nested POST (session → logs → sets), GET paginated, GET /{id}, DELETE
  ☐ Supabase Auth JWT integration
  ☐ Template + Personal Record endpoints
  ☐ Railway deployment

Phase 3 — AI Coach
  ☐ LLM integration via Spring Boot endpoint
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

[Phase 2] → workoutApi.ts → Spring Boot API → PostgreSQL
         ← JWT auth via Supabase
```

---

*Built for lifters who take their training seriously.*
