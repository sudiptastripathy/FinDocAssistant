# ADR-002: Document-Type-Specific vs Vendor-Specific Extraction Rules

## Status
**Accepted** - 2026-02-01

## Context

After implementing the hybrid single-agent architecture (ADR-001), we discovered extraction errors with reference numbers. Specifically, a Costco Optical receipt was extracting "2026" (Invoice NO) instead of the correct order number "002860115L201" (Optical Order #).

### The Problem
Different vendors use different field labels and priorities:
- Costco Optical receipts show both "Invoice NO" and "Optical Order #"
- Amazon receipts show "Order #" prominently
- Medical bills use "Account #" as primary reference
- Utility bills have "Bill #" or "Statement #"

We needed to guide the AI to pick the **right** reference number based on context.

### Initial Approach (Considered)
Vendor-specific rules:
```
IF vendor = "Costco Optical":
  reference_number = "Optical Order #"
  
IF vendor = "Amazon":
  reference_number = "Order #"
  
[etc for each vendor]
```

## Decision

We will use **document-type-specific rules** instead of vendor-specific rules. The agent identifies the document type (retail receipt, invoice, bill, etc.) and applies universal extraction patterns for that type.

## Alternatives Considered

### Option 1: Vendor-Specific Rules ❌

**Implementation:**
```javascript
IF vendor contains "Costco":
  reference_number: "Order #" > "Receipt #"
  
IF vendor contains "Amazon":
  reference_number: "Order Number" > "Shipment ID"
  
IF vendor contains "AT&T":
  reference_number: "Account #" > "Bill #"
```

**Pros:**
- ✅ Maximum accuracy for known vendors
- ✅ Can handle truly unique vendor formats
- ✅ Specific to each vendor's structure

**Cons:**
- ❌ Doesn't scale (need rules for every vendor)
- ❌ High maintenance (update rules per vendor change)
- ❌ Fails for new/unknown vendors
- ❌ Prompt becomes very long with many vendors
- ❌ Hard to test comprehensively

**Example Failure:**
User uploads Sam's Club receipt → No Sam's Club rules → Falls back to generic → Lower accuracy

### Option 2: Document-Type-Specific Rules ✅ CHOSEN

**Implementation:**
```javascript
IF document is "retail receipt":
  reference_number priority: Order # → Receipt # → Transaction ID
  
IF document is "invoice":
  reference_number priority: Invoice # → Reference #
  
IF document is "utility bill":
  reference_number priority: Account # → Bill #
```

**Pros:**
- ✅ Scales to any vendor following standard patterns
- ✅ Lower maintenance (fewer rule sets)
- ✅ Works for unknown vendors automatically
- ✅ Shorter, cleaner prompts
- ✅ Easier to test (test per type, not per vendor)
- ✅ More robust to document variations

**Cons:**
- ⚠️ May miss truly vendor-unique formats (rare)
- ⚠️ Requires document type identification first

**Example Success:**
User uploads Sam's Club receipt → Identifies as "retail receipt" → Applies receipt rules → Extracts Order # correctly

### Option 3: Hybrid (Document-Type + Vendor Overrides) ❌

**Implementation:**
```javascript
IF document is "retail receipt":
  Default: Order # → Receipt #
  IF vendor = "Costco": Override to "Optical Order #"
```

**Pros:**
- ✅ Handles both standard and unique cases
- ✅ Scalable with fallback to type rules

**Cons:**
- ❌ More complex to maintain
- ❌ Still requires per-vendor rules
- ❌ Over-engineering for current needs
- ❌ May revisit if truly unique vendors emerge

## Rationale

### Why Document-Type Rules Won

1. **Scalability**: 6 document types vs 100s of vendors
2. **Standardization**: Most vendors follow industry standards
3. **Maintainability**: One rule set per type, not per vendor
4. **Generalization**: Works for vendors never seen before
5. **Testability**: Test 6 types vs testing N vendors
6. **Prompt Length**: Shorter prompts = lower cost + better performance

### Real-World Validation

Tested across document types:
- ✅ Costco Optical receipt → Correctly extracts Order #
- ✅ Generic invoice → Correctly extracts Invoice #
- ✅ Medical bill → Correctly extracts Account #
- ✅ Restaurant receipt → Correctly extracts Receipt #

### Edge Cases Handled

**Multiple reference numbers:**
- Retail receipt with both Order # and Receipt # → Prioritizes Order #
- Invoice with both Invoice # and PO # → Prioritizes Invoice #

**Unclear document type:**
- Falls back to generic priority: Order # → Invoice # → Receipt #

**Vendor truly unique:**
- Can add vendor override as exception (not yet needed)

## Implementation Details

### Document Type Identification
Agent analyzes document for indicators:
- **Retail receipt**: "PAID", "APPROVED", payment method, timestamp
- **Invoice**: "INVOICE" header, "Amount Due", due date
- **Bill**: Utility company, "Account #", service period
- **Statement**: "Balance", "Previous Charges", account summary

### Reference Number Priority Lists

```
RETAIL RECEIPTS:
  1. Order # / Order Number
  2. Receipt # / Receipt Number
  3. Transaction ID / Trans ID
  
INVOICES:
  1. Invoice # / Invoice Number / Invoice No
  2. Reference #
  
BILLS (Utility/Service):
  1. Account # / Account Number
  2. Bill # / Statement #
  
MEDICAL DOCUMENTS:
  1. Account # / Patient Account
  2. Statement #
  3. Visit #
  (IGNORE: NPI, Provider ID, Member ID)
```

### Ignore Lists
Explicitly ignore non-reference fields:
- Member IDs, Loyalty numbers
- NPI numbers (medical)
- Seat numbers, Profile numbers
- Customer IDs (unless no other reference exists)

## Consequences

### Positive
- ✅ Works across any vendor following standard formats
- ✅ Easier to add new document types than new vendors
- ✅ Lower maintenance burden
- ✅ More predictable behavior
- ✅ Better test coverage

### Negative
- ⚠️ May need vendor overrides for truly unique formats
- ⚠️ Depends on accurate document type identification

### Mitigation
- Monitor extraction accuracy per document type
- Collect edge cases where type rules fail
- Add vendor override mechanism if pattern emerges (>10% of documents)
- Improve type identification if misclassification occurs

## Migration from Vendor Rules

**Before (Vendor-specific):**
```javascript
IF vendor contains "Costco Optical":
  reference_number = "Optical Order #"
  IGNORE "Invoice NO"
```

**After (Document-type):**
```javascript
IF document is "retail receipt":
  reference_number priority: Order # → Receipt # → Trans ID
  IGNORE: Member IDs, Invoice numbers (internal tracking)
```

## Testing Strategy

- ✅ Test each document type with 3+ different vendors
- ✅ Verify correct type identification
- ✅ Validate reference number extraction per type
- ✅ Test documents with multiple reference numbers
- ✅ Test edge case: unclear document type

## Future Considerations

### When to Add Vendor Overrides
Only if we see:
- >10% of documents from one vendor consistently fail
- Vendor uses completely non-standard format
- Business requirement for specific vendor handling

### Alternative Future Approach
If vendor-specific needs grow:
- Keep document-type as default
- Add optional `vendor_overrides` section
- Apply overrides only when document-type rules insufficient

## References
- [ADR-001](0001-agent-architecture.md) - Agent architecture choice
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - System design
- [claudeService.js](../../src/services/claudeService.js) - Implementation

## Examples

### Example 1: Costco Optical Receipt
```
Document has:
- "Costco Optical" logo
- "APPROVED" stamp
- "INVOICE NO: 2026"
- "OPTICAL ORDER #: 002860115L201"

Agent logic:
1. Identifies as "retail receipt" (APPROVED, payment shown)
2. Applies receipt rules: Order # → Receipt # → Trans ID
3. Finds "OPTICAL ORDER #: 002860115L201"
4. Extracts: reference_number = "002860115L201" ✅
```

### Example 2: Generic Invoice
```
Document has:
- "INVOICE" header
- "Invoice #: INV-12345"
- "Amount Due: $500"
- "Payment Due Date: 2026-03-01"

Agent logic:
1. Identifies as "invoice" (due date, amount due)
2. Applies invoice rules: Invoice # → Reference #
3. Finds "Invoice #: INV-12345"
4. Extracts: reference_number = "INV-12345" ✅
```

## Reviewers
- Primary developer: Portfolio project

## Revision History
- 2026-02-01: Initial decision documented
- 2026-02-01: Implemented in claudeService.js
