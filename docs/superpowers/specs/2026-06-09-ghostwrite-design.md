# GhostWrite — Design Spec

## Overview

GhostWrite is a platform that lets users continue receiving letters from deceased loved ones by building a "digital soul" from their historical data (chat logs, photos, social media). The AI generates letters in the deceased's voice, delivered on a schedule chosen by the user.

Phase 1 builds the MVP core: data upload, personality modeling, letter generation, and delivery.

## Goals

1. Let users upload chat logs, text, and photos to create a personality profile of a deceased loved one.
2. Generate letters in that person's voice using GPT-4 with structured prompting.
3. Deliver letters on a user-defined schedule (weekly, monthly, special dates).
4. Include a "reality anchor" on every letter: "这封信来自AI对[姓名]的记忆重建".
5. Provide a manual review workflow for psych team curation during pilot phase.
6. Support "future self" letters as a public-facing entry point.

## Non-Goals

- Federated learning / on-device inference (post-MVP).
- Handwriting style transfer (post-MVP).
- Family tree multi-sender mode (post-MVP).
- Blockchain legacy storage (post-MVP).
- Emotional progression tracking / grief stage detection (post-MVP).
- Voice or photo generation (post-MVP).
- LoRA fine-tuning for MVP (prompt engineering with GPT-4 is sufficient for validation).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 14 App                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Onboarding  │  │   Letters    │  │   Future Self UI     │   │
│  │   Wizard     │  │   Inbox      │  │   (Write + Schedule) │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │ tRPC / API Routes
┌────────────────────┴────────────────────────────────────────────┐
│                    Services Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Upload      │  │  Personality │  │   Letter Generator   │   │
│  │  Service     │  │  Extractor   │  │   (GPT-4)            │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Scheduler   │  │  Delivery    │  │   Psych Review       │   │
│  │  (Cron)      │  │  Service     │  │   Queue              │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────────┐
│                      Data Layer                                  │
│  PostgreSQL  │  Local File Storage (MVP)  │  OpenAI API        │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, tRPC for type-safe APIs
- **Database**: PostgreSQL via Prisma ORM
- **AI**: OpenAI GPT-4o API with structured JSON output
- **File Storage**: Local filesystem for MVP (S3 for production)
- **Scheduling**: node-cron for MVP (BullMQ or Inngest for production)
- **Auth**: NextAuth.js with credentials provider
- **Payment**: Stripe (future self letters premium tier)

## Data Model

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  soulProfiles  SoulProfile[]
  letters       Letter[]
  futureLetters FutureLetter[]
  subscription  Subscription?
}

model SoulProfile {
  id              String   @id @default(uuid())
  userId          String
  name            String   // Deceased person's name
  relationship    String   // "grandmother", "father", etc.
  personalityJson String   @db.Text // Extracted personality traits
  memoriesJson    String   @db.Text // Key memories extracted from uploads
  toneStyle       String   // "warm", "formal", "playful", etc.
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id])
  letters         Letter[]
  uploads         Upload[]
  schedules       Schedule[]
}

model Upload {
  id            String      @id @default(uuid())
  soulProfileId String
  type          String      // "chat_log", "photo", "text", "audio_transcript"
  filename      String
  content       String?     @db.Text // Extracted text content
  metadataJson  String?     @db.Text // Parsed metadata
  createdAt     DateTime    @default(now())
  
  soulProfile   SoulProfile @relation(fields: [soulProfileId], references: [id])
}

model Letter {
  id              String      @id @default(uuid())
  userId          String
  soulProfileId   String?
  type            String      // "soul_letter", "future_self"
  content         String      @db.Text
  tone            String      // "comforting", "encouraging", "nostalgic"
  realityAnchor   String      @default("")
  status          String      // "draft", "pending_review", "approved", "delivered", "rejected"
  scheduledFor    DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime    @default(now())
  
  user            User        @relation(fields: [userId], references: [id])
  soulProfile     SoulProfile? @relation(fields: [soulProfileId], references: [id])
}

model Schedule {
  id              String      @id @default(uuid())
  soulProfileId   String
  frequency       String      // "weekly", "monthly", "special_date"
  dayOfWeek       Int?        // 0-6 for weekly
  dayOfMonth      Int?        // 1-31 for monthly
  specialDate     DateTime?   // For anniversary, birthday, etc.
  nextRunAt       DateTime
  isActive        Boolean     @default(true)
  
  soulProfile     SoulProfile @relation(fields: [soulProfileId], references: [id])
}

model FutureLetter {
  id          String    @id @default(uuid())
  userId      String
  content     String    @db.Text
  deliverAt   DateTime
  isDelivered Boolean   @default(false)
  createdAt   DateTime  @default(now())
  
  user        User      @relation(fields: [userId], references: [id])
}

model Subscription {
  id        String   @id @default(uuid())
  userId    String   @unique
  tier      String   // "free", "basic", "family"
  stripeSubId String?
  expiresAt DateTime?
  
  user      User     @relation(fields: [userId], references: [id])
}
```

## Key Flows

### 1. Onboarding Flow

```
User signs up → Creates SoulProfile (name, relationship) 
  → Uploads chat logs / text / photos
  → System extracts personality via GPT-4
  → User reviews sample letter
  → User sets schedule (weekly/monthly/special dates)
  → Confirmation
```

**Personality Extraction Prompt**:
```
Analyze the following chat logs and texts from {name}. Extract:
1. Communication style (tone, vocabulary, sentence structure)
2. Common phrases and expressions they used
3. Topics they frequently discussed
4. Their relationship with the recipient (affection level, inside jokes, shared memories)
5. Values and perspectives they expressed
6. Emotional patterns (how they showed care, concern, joy, etc.)

Return as structured JSON.
```

### 2. Letter Generation Flow

```
Cron job checks schedules → Finds due letters
  → Fetches SoulProfile (personalityJson, memoriesJson)
  → Builds prompt with personality + recent context
  → Calls GPT-4 to generate letter
  → Appends reality anchor footer
  → Saves as Letter with status "pending_review" (pilot) or "approved"
  → Queues for delivery
```

**Letter Generation Prompt**:
```
You are writing a letter from {deceased_name} to their {relationship}.

Their communication style: {tone_style}
Common phrases they used: {common_phrases}
Topics they cared about: {topics}
Shared memories to reference: {memories}

Write a {length} letter that:
1. Sounds authentically like {deceased_name}
2. References a specific shared memory naturally
3. Offers emotional support appropriate to the recipient's current situation
4. Mentions something current (a season, general world context, or passage of time)
5. Ends with an expression of love or care typical of {deceased_name}

Do NOT mention being dead, an AI, or anything supernatural. Write as if {deceased_name} is still alive and simply reaching out.
```

### 3. Delivery Flow

```
Letter status = "approved" and scheduledFor <= now
  → Mark as "delivered"
  → Send email notification (optional)
  → Display in user's letter inbox
  → Update schedule nextRunAt
```

### 4. Future Self Letter Flow

```
User writes letter → Sets delivery date
  → Encrypts and stores content
  → Scheduled for delivery
  → On delivery date: decrypt, deliver to user
```

## API Design (tRPC Routers)

```typescript
// soulProfile router
soulProfile.create          // Create new soul profile
soulProfile.getById         // Get profile with uploads
soulProfile.list            // List all profiles for user
soulProfile.update          // Update profile details
soulProfile.delete          // Soft delete

// upload router
upload.create               // Upload file/text, trigger extraction
upload.getByProfile         // List uploads for a profile
upload.delete               // Remove upload

// letter router
letter.generateSample       // Generate sample letter for review
letter.list                 // List letters for user
letter.getById              // Get single letter
letter.updateStatus         // For psych review workflow
letter.createFuture         // Create future self letter

// schedule router
schedule.create             // Create delivery schedule
schedule.update             // Modify schedule
schedule.pause              // Pause deliveries
schedule.resume             // Resume deliveries
```

## Error Handling

- **Upload failures**: Retry with exponential backoff, notify user if persistent.
- **GPT-4 API failures**: Queue for retry, fallback to simpler prompt if repeated.
- **Generation quality issues**: Flag for manual review, don't auto-deliver.
- **Database errors**: Log detailed error, return user-friendly message.
- **Scheduling edge cases**: Handle timezone differences, daylight saving changes.

## Security & Ethics

- **Reality Anchor**: Every letter ends with: "这封信来自AI对[姓名]的记忆重建"
- **Data Privacy**: All uploaded data encrypted at rest, never used for model training.
- **User Control**: One-click pause/stop/delete for all letters and data.
- **Psych Review**: Pilot phase requires manual approval before delivery.
- **Content Guardrails**: Block letters that mention being dead, AI, or supernatural.
- **Rate Limiting**: Prevent abuse of letter generation API.

## Testing Strategy

- **Unit Tests**: Personality extraction, prompt building, scheduling logic (80%+ coverage).
- **Integration Tests**: Full letter generation flow, upload processing, delivery pipeline.
- **E2E Tests**: User onboarding, letter reading, schedule creation.

## Deployment

- **MVP Hosting**: Vercel (frontend + API), Railway/Render (PostgreSQL).
- **Environment Variables**: OPENAI_API_KEY, DATABASE_URL, NEXTAUTH_SECRET, etc.
- **Migrations**: Prisma migrate for schema changes.

## Success Metrics

- 20 pilot families onboarded within 2 weeks.
- 80%+ letter approval rate by psych team.
- 50%+ of future self letter users convert to paid tier.
- Zero letters delivered without reality anchor.

## Open Questions

1. Should we support multi-language letters (Chinese vs English)?
2. What is the exact psych review workflow — in-app approval or external tool?
3. How do we source "current context" (news, weather) for letters?
