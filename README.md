# Job Search Chatbot

AI-powered chatbot for querying California county job positions using Next.js 15 and Google Gemini.

## Quick Start

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Get API key"** or **"Create API key"**
4. Select **"Create API key in new project"** (or use an existing project)
5. Copy your API key

**Note:** The free tier includes:
- 15 requests per minute
- 1,500 requests per day
- Rate limits vary by model

### 2. Install and Run

```bash
npm install
echo "GEMINI_API_KEY=your_api_key_here" > .env.local
npm run dev
# Open http://localhost:3000/chat
```

## Features

### 1. Compound Component Architecture
Clean, composable chat interface with context-based state sharing:

```tsx
<ChatInterface>
  <ChatInterfaceHeader />
  <ChatInterfaceEmptyState />
  <ChatInterfaceMessages />
  <ChatInterfaceInput />
</ChatInterface>
```

### 2. Smart Job Filtering
- **Highly optimized**: Only 3-5 most relevant jobs sent to LLM per query (98% token reduction vs sending all 370)
- Fuzzy matching algorithm with weighted scoring: title (1.5x) > role definition (1.0x) > duties (0.8x)
- Jurisdiction-aware filtering for precise county-specific results
- Pre-filtering before LLM call minimizes API costs and maximizes response accuracy
- Efficient data processing addresses core assignment requirement

### 3. Type-Safe Data Layer
- Zod schemas with runtime validation
- Automatic snake_case → camelCase transformation
- TypeScript strict mode throughout

### 4. AI Context Management
- Automatic keyword extraction (jurisdiction, job title, query type)
- Dynamic job filtering based on user queries
- Full conversation history included for multi-turn conversations
- Contextual responses with filtered job data

### 5. localStorage Persistence
- Chat history saved locally
- No database required
- Automatic cleanup of old chats

## Example Queries

```
What is the salary for Assistant Sheriff in San Diego?
What are the duties of a Probation Officer in San Bernardino?
What qualifications do I need for Assistant Chief Probation Officer?
```

## Project Structure

```
/app
  /(chat)/chat/page.tsx         # Chat page
  /api/chat/route.ts            # Streaming API endpoint
  /layout.tsx                   # Root layout
  /page.tsx                     # Landing page

/components
  /chat/ChatInterface.tsx       # Compound chat component

/lib
  /ai/                          # OpenAI integration
  /data/                        # Zod schemas & job filtering
  /storage/                     # localStorage management

/data
  /gold/jobs.json               # 370 job positions

/tests
  /unit/                        # 32 unit tests (100% passing)
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **AI:** Google Gemini 2.5 Flash Lite (via @google/generative-ai SDK)
- **Validation:** Zod
- **Styling:** Tailwind CSS 4
- **Testing:** Vitest + React Testing Library
- **Icons:** Lucide React

**Note:** Some dependencies are currently unused and can be removed in production:
- `@ai-sdk/openai` - OpenAI SDK (using Google Gemini instead)
- `react-markdown` & `remark-gfm` - Markdown rendering (custom table renderer used instead)
- `ai` - Vercel AI SDK (using Google's native SDK for streaming)

## Commands

```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run test             # Run tests
npm run test:ui          # Run tests with UI
npm run lint             # Run linter
```

## Architecture

### Data Flow
```
User Query → ChatInterface → API Route → AI Tool Extraction
                                ↓
                          Filter Jobs (fuzzy match)
                                ↓
                          Format Context
                                ↓
                          LLM Response → Stream to Client
```

### Fuzzy Matching
```typescript
// Calculates similarity score (0-1)
calculateSimilarity("Assistant Sheriff", "Sheriff Assistant") // → 0.8

// Weighted scoring
- Exact job code match: +10 points
- Jurisdiction match: required (threshold 0.5)
- Title field: 1.5x weight
- Role definition: 1.0x weight
- Example duties: 0.8x weight
```

### Type Safety
```typescript
// Zod schema with automatic transformation
const JobSchema = z.object({
  job_code: z.number(),
  salary_grade_1: z.number().nullable(),
  // ... all fields in snake_case
}).transform(data => 
  mapKeys(data, (_, key) => camelCase(key))
);

// Type automatically inferred
export type Job = z.infer<typeof JobSchema>;
```

## Testing

32 unit tests with 100% pass rate:

- **Type System (7 tests)** - Schema transformation, salary calculations
- **Job Filtering (15 tests)** - Fuzzy matching, similarity scoring
- **Storage (10 tests)** - localStorage, chat management

```bash
npm run test
# ✅ 32/32 passing
```

## Deployment

Works on any platform supporting Node.js:
- Vercel (recommended)
- Netlify
- AWS Amplify
- Google Cloud Run

Set `GEMINI_API_KEY` in your production environment.

## Performance

- **Optimized Filtering:** Only relevant jobs sent to LLM
- **Streaming Responses:** Real-time AI responses
- **Client Storage:** No server database queries
- **Edge Runtime:** Low latency API routes

## License

MIT
