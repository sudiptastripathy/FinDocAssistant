# Changelog

All notable changes to the Invoice Assistant project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **[2026-02-01]** Refactored extraction agent from vendor-specific to document-type-specific rules (ADR-002)
  - Replaced Costco/vendor-specific logic with universal document patterns
  - Improved reference number extraction for retail receipts, invoices, bills
  - Enhanced scalability and maintainability
- **[2026-02-01]** Fixed Claude Haiku model name in Score Agent
  - Changed from incorrect `claude-haiku-4-20250514` to `claude-4-haiku-20250514`
  - Resolved 404 NotFoundError in scoring pipeline

### Added
- **[2026-02-01]** Document-type detection with specific extraction priorities
  - Retail receipts: Order # → Receipt # → Transaction ID
  - Invoices: Invoice # → Reference #
  - Bills: Account # → Bill #
  - Medical documents: Account # → Statement # → Visit #
  - Statements: Statement # → Account #
- **[2026-02-01]** Explicit ignore list for non-reference fields
  - Member IDs, Loyalty numbers, NPI, Seat numbers, Profile numbers
- **[2026-02-01]** Two-step extraction process
  - Step 1: Identify document type
  - Step 2: Apply type-specific rules

### Rationale
- **Document-type approach**: Scales better than vendor-specific rules, works across all vendors following standard formats
- **Model name fix**: Corrects API compatibility issue with Anthropic's naming convention
- **Structured extraction**: Improves accuracy by applying context-aware logic based on document characteristics

## [0.1.0] - Initial Development

### Added
- Multi-agent architecture with Extract, Validate, and Score agents
- Claude Sonnet 4 integration for document extraction
- Claude Haiku 4 integration for confidence scoring
- Validation service with business rules
- Orchestrator for coordinating agent pipeline
- React UI with upload, processing, and review pages
- History page with local storage persistence
- Cost tracking across all API calls
- Field-level confidence badges
- Manual edit capability for extracted fields
- Responsive design with Tailwind CSS

### Technical Stack
- React 19 + Vite
- Anthropic Claude AI (Sonnet 4 + Haiku 4)
- React Router for navigation
- LocalStorage for history persistence
- Tailwind CSS for styling

### Features
- Image upload with drag-and-drop
- Multi-modal document extraction (invoices, receipts, bills)
- Real-time processing status
- Confidence scoring per field
- Manual review and editing
- Export functionality
- Historical extraction tracking
- Cost monitoring

---

## Documentation Standards

When adding entries:
- **Date format**: [YYYY-MM-DD]
- **Categories**: Added, Changed, Deprecated, Removed, Fixed, Security
- **Reference ADRs** when applicable
- **Include rationale** for significant changes
- **Link to issues/PRs** when available (future)

## Future Planned Changes

### Upcoming
- [ ] Backend API migration (security improvement)
- [ ] Database integration for history
- [ ] Multi-page document support
- [ ] PDF extraction capability
- [ ] Batch processing
- [ ] Export to accounting systems

### Under Consideration
- [ ] Multi-agent specialist architecture (if volume justifies)
- [ ] Real-time collaboration features
- [ ] Mobile app version
- [ ] OCR fallback for low-quality images
