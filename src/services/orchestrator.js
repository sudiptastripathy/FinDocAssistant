// src/services/orchestrator.js
import { extractDocumentData, scoreExtractedData } from './claudeService.js';
import { validateDocumentData, getValidationSummary } from './validationService.js';
import { formatForForm } from './formatService.js';
import { logger, getUserFriendlyError } from './logger.js';

/**
 * Map extraction agent field names to UI field names
 * Extraction agent uses: reference_number, transaction_date, total_amount
 * UI expects: invoice_number, invoice_date, amount_due
 */
function mapExtractedFields(extractedData) {
  return {
    ...extractedData,
    // Map extraction field names to UI field names
    invoice_number: extractedData.reference_number,
    invoice_date: extractedData.transaction_date,
    amount_due: extractedData.total_amount,
    due_date: extractedData.payment_due_date,
    // Keep original fields for backward compatibility
    reference_number: extractedData.reference_number,
    transaction_date: extractedData.transaction_date,
    total_amount: extractedData.total_amount,
    payment_due_date: extractedData.payment_due_date
  };
}

export async function processDocument(imageBase64, onProgress) {
  const state = {
    status: 'processing',
    currentStep: null,
    extracted: null,
    validated: null,
    scored: null,
    formatted: null,
    errors: [],
    costs: { total: 0, breakdown: {} }
  };

  try {
    reportProgress(onProgress, 'extracting', 'Extracting document data...');
    logger.info('Starting document extraction', { hasImage: !!imageBase64 });
    
    const extractResult = await extractDocumentData(imageBase64);
    
    if (!extractResult.success) {
      const friendlyError = getUserFriendlyError(
        { message: extractResult.error, type: extractResult.errorType },
        { step: 'extract' }
      );
      
      state.errors.push({ 
        step: 'extract', 
        error: extractResult.error,
        userMessage: friendlyError.message,
        title: friendlyError.title
      });
      
      logger.error('Extraction failed', new Error(extractResult.error), {
        step: 'extract',
        errorType: extractResult.errorType
      });
      
      state.status = 'failed';
      reportProgress(onProgress, 'failed', friendlyError.message, state);
      return state;
    }
    
    // Map extraction agent field names to UI field names
    const mappedData = mapExtractedFields(extractResult.data);
    state.extracted = mappedData;
    state.costs.breakdown.extract = extractResult.cost;
    state.costs.total += extractResult.cost.total_cost;
    
    // Accept all financial document types (invoice, receipt, bill, statement, etc.)
    const validDocTypes = ['invoice', 'receipt', 'bill', 'statement', 'order_confirmation'];
    if (state.extracted.document_type === 'unknown' || !validDocTypes.includes(state.extracted.document_type)) {
      const friendlyError = getUserFriendlyError(null, { documentType: state.extracted.document_type });
      state.errors.push({
        step: 'extract',
        error: `Unable to identify document type (detected: ${state.extracted.document_type})`,
        userMessage: friendlyError.message,
        title: friendlyError.title
      });
      logger.warn('Could not identify document type', { documentType: state.extracted.document_type });
      state.status = 'failed';
      reportProgress(onProgress, 'failed', friendlyError.message, state);
      return state;
    }
    
    if (state.extracted.extraction_quality === 'low') {
      const friendlyError = getUserFriendlyError(null, { extractionQuality: 'low' });
      state.errors.push({ step: 'extract', warning: friendlyError.message });
      logger.warn('Low extraction quality', { quality: state.extracted.extraction_quality });
    }
    
    reportProgress(onProgress, 'extracted', 'Extraction complete', state);
    
    reportProgress(onProgress, 'validating', 'Validating data...');
    state.validated = validateDocumentData(state.extracted);
    
    const validationSummary = getValidationSummary(state.validated);
    if (!validationSummary.allValid) {
      state.errors.push({ step: 'validate', warning: `${validationSummary.errors} validation error(s) found` });
    }
    
    reportProgress(onProgress, 'validated', 'Validation complete', state);
    
    reportProgress(onProgress, 'scoring', 'Calculating confidence scores...');
    const scoreResult = await scoreExtractedData(state.extracted, state.validated);
    
    if (!scoreResult.success) {
      state.errors.push({ step: 'score', warning: 'Confidence scoring failed, using validation results as proxy' });
      state.scored = generateFallbackScores(state.validated);
    } else {
      state.scored = scoreResult.scores;
      state.costs.breakdown.score = scoreResult.cost;
      state.costs.total += scoreResult.cost.total_cost;
    }
    
    reportProgress(onProgress, 'scored', 'Scoring complete', state);
    
    reportProgress(onProgress, 'formatting', 'Preparing form data...');
    state.formatted = formatForForm(state.extracted, state.validated, state.scored);
    
    if (state.formatted.review_required.length > 0) {
      state.errors.push({
        step: 'format',
        warning: `${state.formatted.review_required.length} field(s) require review (confidence < 0.7)`
      });
    }
    
    reportProgress(onProgress, 'formatted', 'Format complete', state);
    
    state.status = 'complete';
    state.currentStep = 'complete';
    reportProgress(onProgress, 'complete', 'Processing complete', state);
    
    return state;
    
  } catch (error) {
    logger.error('Orchestrator error', error, {
      status: state.status,
      currentStep: state.currentStep
    });
    
    const friendlyError = getUserFriendlyError(error);
    
    state.status = 'failed';
    state.errors.push({ 
      step: 'orchestrator', 
      error: error.message,
      userMessage: friendlyError.message,
      title: friendlyError.title
    });
    reportProgress(onProgress, 'failed', friendlyError.message, state);
    return state;
  }
}

function reportProgress(callback, step, message, state = null) {
  if (callback) {
    callback({ step, message, state });
  }
}

function generateFallbackScores(validationResults) {
  const scores = {};
  
  Object.entries(validationResults).forEach(([field, result]) => {
    if (result.valid && !result.warning) {
      scores[field] = { confidence: 0.80, reasoning: 'Passed validation (fallback score)' };
    } else if (result.valid && result.warning) {
      scores[field] = { confidence: 0.65, reasoning: `Passed validation with warning: ${result.warning}` };
    } else {
      scores[field] = { confidence: 0.00, reasoning: `Validation failed: ${result.error}` };
    }
  });
  
  return scores;
}

export function getPipelineSummary(state) {
  if (!state || state.status === 'processing') {
    return null;
  }
  
  const fieldsExtracted = state.extracted ? Object.keys(state.extracted).length : 0;
  const fieldsValid = state.validated ? Object.values(state.validated).filter(v => v.valid).length : 0;
  const fieldsRequiringReview = state.formatted?.review_required?.length || 0;
  const readyToFill = state.formatted?.ready_to_fill || false;
  
  return {
    fieldsExtracted,
    fieldsValid,
    fieldsRequiringReview,
    readyToFill,
    totalCost: state.costs.total,
    errors: state.errors,
    warnings: state.errors.filter(e => e.warning).length
  };
}
