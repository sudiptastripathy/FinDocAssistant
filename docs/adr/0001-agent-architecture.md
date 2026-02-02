# ADR-001: Hybrid Single-Agent vs Multi-Agent Architecture

## Status
**Accepted** - 2026-02-01

## Context

When building an AI-powered invoice extraction system, we needed to decide on the agent architecture. The core question: Should we use a single extraction agent or multiple specialist agents?

### The Problem
Different document types (retail receipts, invoices, bills, medical statements) have varying structures and field priorities. For example:
- Costco receipts have "Order #" as primary reference, not "Invoice NO"
- Medical bills use "Account #" as primary reference
- Standard invoices use "Invoice #"

A generic extraction agent was making mistakes by not understanding document-specific contexts.

### Requirements
- High extraction accuracy across document types
- Fast processing (low latency)
- Cost-effective API usage
- Maintainable and scalable architecture
- Good for MVP/portfolio project timeline

## Decision

We will use a **hybrid single-agent approach**: one extraction agent with document-type-specific conditional logic embedded in the prompt.

## Alternatives Considered

### Option 1: Multi-Agent Architecture ❌
**Design:**
```
User Upload → Classification Agent → Specialist Extractors → Results
              (Haiku)                 (Sonnet per type)
```

**Pros:**
- ✅ Highest extraction accuracy (specialists optimized per type)
- ✅ Maximum modularity (add/update specialists independently)
- ✅ Clear separation of concerns
- ✅ Easy to version individual extractors
- ✅ Can use different models per specialist (cost optimization)

**Cons:**
- ❌ Higher latency (2+ sequential API calls)
- ❌ More complex architecture (classification + routing logic)
- ❌ Higher cost (additional classification API call)
- ❌ More failure points (classifier or specialist can fail)
- ❌ Over-engineering for current scale (<100 docs/day)
- ❌ More prompt engineering work (N specialists to maintain)

### Option 2: Pure Single-Agent (Generic) ❌
**Design:**
```
User Upload → Extract Agent → Results
              (Sonnet)
```

**Pros:**
- ✅ Simplest architecture
- ✅ Lowest latency (1 API call)
- ✅ Easiest to implement

**Cons:**
- ❌ Lower accuracy (no document-specific logic)
- ❌ Generic prompts miss context-specific patterns
- ❌ Hard to improve without making prompt too complex

### Option 3: Hybrid Single-Agent (CHOSEN) ✅
**Design:**
```
User Upload → Extract Agent with Conditional Logic → Results
              (Sonnet with type-specific rules)
```

**Implementation:**
- Agent identifies document type first (receipt, invoice, bill, etc.)
- Then applies type-specific extraction rules within same prompt
- Uses priority lists for field extraction based on type

**Pros:**
- ✅ Good extraction accuracy (type-specific logic)
- ✅ Low latency (1 API call)
- ✅ Simpler than multi-agent
- ✅ Cost-effective (no classification call)
- ✅ Maintainable (single prompt to update)
- ✅ Sufficient for current scale
- ✅ Clear migration path to multi-agent if needed

**Cons:**
- ⚠️ Prompt becomes longer as types increase
- ⚠️ Slightly lower accuracy than specialist agents
- ⚠️ All types use same model (can't optimize per type)

## Rationale

### Why Hybrid Won

1. **Latency**: Users expect <5s total processing. Multi-agent adds 2-3s.
2. **Cost**: Classification call + extraction = ~40% more expensive
3. **Scale**: Current/expected volume doesn't justify multi-agent complexity
4. **MVP Timeline**: Single agent faster to implement and iterate
5. **Performance**: 95%+ accuracy achievable with conditional logic
6. **Maintainability**: One prompt easier to debug than N prompts

### When to Migrate to Multi-Agent

We should reconsider if:
- Volume exceeds 1,000 documents/day
- Accuracy drops below 90% consistently
- Processing >10 distinct document types
- Different teams maintain different extractors
- Need to use different models per type (e.g., Haiku for simple receipts)

## Implementation Details

### Prompt Structure
```
STEP 1: Identify document type
STEP 2: Apply type-specific extraction rules

RETAIL RECEIPTS:
  - reference_number priority: Order # → Receipt # → Trans ID
  
INVOICES:
  - reference_number priority: Invoice # → Reference #

[etc for each type]
```

### Testing Strategy
- Test each document type independently
- Verify correct type identification
- Validate type-specific rules applied
- Compare accuracy vs multi-agent approach

## Consequences

### Positive
- ✅ Fast development and iteration
- ✅ Easy debugging (single prompt to inspect)
- ✅ Good balance of accuracy and simplicity
- ✅ Lower operational cost
- ✅ Users get fast results

### Negative
- ⚠️ Prompt maintenance as types grow
- ⚠️ Can't optimize models per document type
- ⚠️ May need refactor if scale increases significantly

### Mitigation
- Monitor extraction accuracy per document type
- Track prompt token usage
- Set threshold for migration (e.g., >15 document types → split)
- Keep orchestrator modular to enable multi-agent swap

## References
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System overview
- [ADR-002](0002-document-type-rules.md) - Document-type vs vendor-specific rules
- Anthropic Prompt Engineering Guide: https://docs.anthropic.com/claude/docs/prompt-engineering

## Reviewers
- Primary developer: Portfolio project

## Revision History
- 2026-02-01: Initial decision documented
