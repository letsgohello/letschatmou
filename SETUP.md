# Setup Guide

## Prerequisites

- Node.js 18+
- Google Gemini API key ([get one here](https://makersuite.google.com/app/apikey))

## Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env.local`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### "GEMINI_API_KEY environment variable is required"
- Verify `.env.local` exists in root directory
- Check API key is correct
- Restart dev server after adding file

### Build Errors
```bash
rm -rf .next
npm run build
```

### TypeScript Errors
```bash
npm install
npx tsc --noEmit
```

## Production Build

```bash
npm run build
npm start
```

Make sure to set `GEMINI_API_KEY` in your production environment.

## Key Implementation Details

### Compound Components
The chat interface uses context-based state sharing:

```typescript
// Main component manages state
function ChatInterfaceRoot({ children }) {
  const [messages, setMessages] = useState([]);
  return (
    <ChatContext.Provider value={{messages, sendMessage, ...}}>
      {children}
    </ChatContext.Provider>
  );
}

// Subcomponents access via hook
function Header() {
  const { messages, clearChat } = useChatContext();
  // ...
}

// Export with subcomponents attached
export { ChatInterfaceRoot as ChatInterface };
export { Header as ChatInterfaceHeader };
// ...
```

### Zod Schema with Lodash
Dynamic field generation with automatic transformation:

```typescript
const JobSchemaRaw = z.object({
  jurisdiction: z.string(),
  job_code: z.number(),
  
  // Generate 14 salary grades dynamically
  ...Object.fromEntries(
    Array.from({ length: 14 }, (_, i) => 
      [`salary_grade_${i + 1}`, z.number().nullable()]
    )
  ),
  
  // Generate string fields dynamically
  ...Object.fromEntries(
    ['title', 'role_definition', ...].map(
      key => [key, z.string().nullable()]
    )
  ),
});

// Transform snake_case → camelCase with lodash
export const JobSchema = JobSchemaRaw.transform(obj =>
  mapKeys(obj, (_, key) => camelCase(key))
);
```

### Runtime Choice
Uses Node.js runtime (not Edge) because:
- Needs `fs/promises` for reading `jobs.json`
- Edge runtime doesn't support file system access
- Node.js runtime is sufficient for this use case

### localStorage Strategy
- Chat history saved client-side
- No database setup required
- Automatic cleanup of old chats (30 days)
- Fast access, no server queries

## Testing

Run tests:
```bash
npm run test        # Run all tests
npm run test:ui     # Interactive UI
npm run test:coverage # With coverage report
```

Test structure:
- `tests/unit/types.test.ts` - Schema & type tests
- `tests/unit/jobs.test.ts` - Filtering & matching tests
- `tests/unit/storage.test.ts` - localStorage tests

## Performance Considerations

- **Job Filtering:** Only 1-5 jobs sent to LLM per query (vs all 370)
- **Streaming:** Responses stream in real-time for better UX
- **Client Storage:** No server database queries needed
- **Caching:** Jobs loaded once per API request

## Future Enhancements

- Vector search with embeddings for semantic job search
- Job caching in memory/Redis
- Multi-turn conversation context
- Export chat history
- Salary visualization charts
- Job comparison side-by-side
