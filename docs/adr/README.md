# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the Invoice Assistant project. ADRs document significant architectural decisions, their context, alternatives considered, and consequences.

## What is an ADR?

An ADR is a document that captures an important architectural decision made along with its context and consequences. It helps:
- Explain "why" behind design choices
- Onboard new team members/contributors
- Avoid revisiting settled decisions
- Track architectural evolution
- Showcase decision-making process (portfolio value)

## ADR Format

Each ADR follows this structure:
- **Status**: Accepted, Proposed, Deprecated, Superseded
- **Context**: The problem and requirements
- **Decision**: What we decided to do
- **Alternatives Considered**: Other options and why they were rejected
- **Rationale**: Why this decision was made
- **Consequences**: Positive and negative impacts
- **Implementation Details**: How it's implemented
- **References**: Links to related docs/code

## Index

### ADR-001: Hybrid Single-Agent vs Multi-Agent Architecture
**Status**: Accepted  
**Date**: 2026-02-01  
**Summary**: Use single extraction agent with document-type-specific logic instead of multiple specialist agents.  
**Key Decision**: Hybrid approach balances accuracy, latency, and maintainability for current scale.

### ADR-002: Document-Type-Specific vs Vendor-Specific Extraction Rules
**Status**: Accepted  
**Date**: 2026-02-01  
**Summary**: Use document-type patterns (receipt, invoice, bill) instead of per-vendor rules for field extraction.  
**Key Decision**: Document-type rules scale better and work across vendors following standard formats.

## Creating a New ADR

### When to Create an ADR
- Significant architectural changes
- Technology/framework choices
- Design pattern decisions
- Trade-offs between approaches
- Changes affecting multiple components

### Template
Use this template for new ADRs:

```markdown
# ADR-XXX: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded by ADR-YYY]

## Context
[Describe the problem and constraints]

## Decision
[State the decision clearly]

## Alternatives Considered
### Option 1: [Name] ❌/✅
[Description, pros, cons]

### Option 2: [Name] ❌/✅
[Description, pros, cons]

## Rationale
[Explain why this decision was made]

## Implementation Details
[How it's implemented]

## Consequences
### Positive
- [Benefits]

### Negative
- [Drawbacks]

### Mitigation
- [How to address drawbacks]

## References
- [Related docs, code, external resources]

## Reviewers
[Who reviewed this decision]

## Revision History
- YYYY-MM-DD: [Change description]
```

### Naming Convention
- Format: `NNNN-short-title.md`
- Example: `0003-backend-api-design.md`
- Number sequentially: 0001, 0002, 0003, etc.

## ADR Lifecycle

1. **Proposed**: Decision under discussion
2. **Accepted**: Decision approved and implemented
3. **Deprecated**: No longer relevant
4. **Superseded**: Replaced by newer ADR

## Contributing

When making architectural changes:
1. Create new ADR in `docs/adr/`
2. Update this README index
3. Reference ADR in code comments
4. Link from ARCHITECTURE.md
5. Update CHANGELOG.md

## Resources

- [ADR GitHub Org](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [ADR Tools](https://github.com/npryce/adr-tools)
