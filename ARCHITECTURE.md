# Invoice Assistant - Architecture

## Overview

Invoice Assistant is an AI-powered document extraction tool that uses Claude AI to extract structured data from financial documents (invoices, receipts, bills, statements). The system uses a multi-agent architecture where specialized AI agents handle different aspects of the extraction pipeline.

## System Architecture

```
User Upload → Extract Agent → Validation Agent → Score Agent → Review UI
               (Claude Sonnet)  (Business Rules)  (Claude Haiku)
```

### Agent Pipeline

1. **Extract Agent** (Claude Sonnet 4)
   - Analyzes document images using vision capabilities
   - Identifies document type (receipt, invoice, bill, statement)
   - Applies document-type-specific extraction rules
   - Returns structured JSON with extracted fields

2. **Validation Agent** (Business Rules)
   - Validates required fields are present
   - Checks data formats (dates, amounts, currency)
   - Applies business rules (e.g., total_amount must be positive)
   - Returns validation results with pass/fail status

3. **Score Agent** (Claude Haiku 4)
   - Generates confidence scores for each extracted field
   - Provides reasoning for scores
   - Analyzes extraction quality and validation results
   - Helps users identify fields needing manual review

### Orchestrator

The orchestrator (`orchestrator.js`) coordinates the agent pipeline:
- Sequences agent calls in proper order
- Handles errors and fallback logic
- Tracks costs across all API calls
- Returns consolidated results to UI

## Design Philosophy

### Hybrid Single-Agent Approach

We use a **single extraction agent with document-type-specific logic** rather than a multi-agent architecture with separate specialist extractors.

**Alternatives Considered:**
1. ❌ **Multi-agent architecture**: Classifier agent → Specialist extractors per document type
2. ❌ **Pure single-agent**: No type-specific logic, generic extraction only
3. ✅ **Hybrid approach**: Single agent with conditional document-type rules

**Why Hybrid?**
- **Lower latency**: 1 API call instead of 2+ (classify → extract)
- **Simpler architecture**: Fewer components, easier to debug
- **Cost effective**: No additional classification API call
- **Sufficient for current scale**: Handles variety without over-engineering
- **Maintainable**: Easy to add new document types
- **Migration path**: Can split into multi-agent later if needed

See [ADR-001](docs/adr/0001-agent-architecture.md) for full analysis.

### Document-Type-Specific Extraction

Instead of vendor-specific rules (e.g., "if Costco, extract field X"), we use **document-type patterns** that work across all vendors:

- **Retail Receipts**: Prioritize Order # → Receipt # → Transaction ID
- **Invoices**: Prioritize Invoice # → Reference #
- **Bills**: Prioritize Account # → Bill #
- **Statements**: Prioritize Statement # → Account #

**Benefits:**
- Scales to any vendor following standard formats
- Less maintenance (no per-vendor rules)
- More robust across document variations
- Easier to test and validate

See [ADR-002](docs/adr/0002-document-type-rules.md) for rationale.

## Technology Stack

### Frontend
- **React 19** with React Router for SPA navigation
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling

### AI/ML
- **Claude Sonnet 4** (`claude-sonnet-4-20250514`) for extraction
- **Claude Haiku 4** (`claude-4-haiku-20250514`) for scoring
- **Anthropic SDK** for API integration

### State & Storage
- **LocalStorage** for extraction history and cost tracking
- React Context for state management (planned)

## Data Flow

```
1. User uploads image → Base64 encoding
2. Extract Agent receives image + prompt
3. Extract Agent returns structured JSON
4. Validation Agent validates JSON
5. Score Agent generates confidence scores
6. Orchestrator combines all results
7. UI displays extracted data + scores
8. User reviews/edits fields
9. User exports or saves to history
```

## Key Design Decisions

### 1. Client-Side AI Calls
**Current**: Direct browser → Anthropic API calls  
**Future**: Move to backend for production

**Rationale**: 
- Faster MVP development
- Lower infrastructure costs for demo
- Security note: API keys exposed (use backend in production)

### 2. Model Selection
- **Sonnet 4**: High accuracy for complex extraction
- **Haiku 4**: Cost-effective for simple scoring

**Cost optimization**: Use cheaper model where accuracy requirements are lower.

### 3. Local Storage for History
**Current**: Browser localStorage  
**Future**: Database for production

**Rationale**: 
- No backend needed for MVP
- Fast access for demo use
- Sufficient for portfolio project

## File Structure

```
src/
├── services/           # AI agents and business logic
│   ├── claudeService.js       # Extract & Score agents
│   ├── validationService.js   # Validation agent
│   ├── orchestrator.js        # Agent pipeline coordinator
│   ├── formatService.js       # Data formatting utilities
│   ├── storageService.js      # LocalStorage management
│   └── logger.js              # Error logging
├── components/         # Reusable UI components
├── pages/             # Route pages
└── utils/             # Helper functions
```

## Future Enhancements

### Potential Migration to Multi-Agent
If volume increases (>1000 docs/day) or accuracy requirements demand it:
1. Add Classification Agent (Haiku) to identify document type
2. Create specialist extraction agents per type
3. Keep orchestrator to coordinate agents
4. Implement fallback to generic agent for unknown types

### Backend Migration
- Move API calls to secure backend
- Add authentication/authorization
- Store history in database (PostgreSQL/MongoDB)
- Add batch processing capabilities

### Enhanced Features
- Multi-page document support
- PDF extraction (not just images)
- Real-time collaboration
- Integration with accounting systems (QuickBooks, Xero)

## Performance Considerations

- **Latency**: ~2-4s for full pipeline (extract + validate + score)
- **Cost**: ~$0.01-0.03 per document (varies by complexity)
- **Accuracy**: ~95%+ on high-quality documents

## Security Notes

⚠️ **Current limitations for production use:**
- API keys in browser (use backend proxy)
- No authentication/authorization
- Client-side storage only
- No data encryption at rest

## Documentation

- [Architecture Decision Records](docs/adr/) - Detailed decision rationale
- [CHANGELOG.md](CHANGELOG.md) - Change history
- [README.md](README.md) - Quick start guide

## Contributing

When making architectural changes:
1. Document decision in new ADR
2. Update this ARCHITECTURE.md
3. Update CHANGELOG.md
4. Add inline code comments referencing ADR
