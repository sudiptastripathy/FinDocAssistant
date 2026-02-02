// src/services/formatService.js

/**
 * FORMAT (Rule-Based Function)
 * Maps extracted and scored invoice data to payment form fields
 * No LLM - static field mapping
 */

// Static field mapping for mock payment form
const FIELD_MAP = {
  payee_name: 'vendor_name',
  payment_amount: 'total_amount',
  reference_number: 'reference_number',
  payment_date: 'payment_due_date',
  transaction_date: 'transaction_date',
  account_holder: 'customer_name'
};

/**
 * Format validated and scored data for form filling
 */
export function formatForForm(extractedData, validationResults, scores) {
  const formFields = {};
  const reviewRequired = [];
  const warnings = [];
  
  // Map each field using static mapping
  Object.entries(FIELD_MAP).forEach(([formField, dataField]) => {
    const value = extractedData[dataField];
    const validation = validationResults[dataField];
    const score = scores?.[dataField];
    
    // Determine if field should be included
    if (!value || !validation?.valid) {
      warnings.push(`${formField}: Missing or invalid data`);
      return;
    }
    
    // Clean and format the value
    const formattedValue = formatValue(dataField, value, validation);
    formFields[formField] = formattedValue;
    
    // Check if review is required (confidence < 0.7)
    if (score && score.confidence < 0.7) {
      reviewRequired.push({
        field: formField,
        value: formattedValue,
        confidence: score.confidence,
        reasoning: score.reasoning
      });
    }
  });
  
  return {
    form_fields: formFields,
    review_required: reviewRequired,
    warnings: warnings,
    ready_to_fill: reviewRequired.length === 0 && warnings.length === 0
  };
}

/**
 * Format individual values based on field type
 */
function formatValue(fieldName, value, validation) {
  // Convert to string if needed for string operations
  const valueStr = typeof value === 'string' ? value : String(value);
  
  switch (fieldName) {
    case 'total_amount':
      // Convert to numeric, remove formatting
      if (typeof value === 'number') {
        return value;
      }
      return validation.numericValue || parseFloat(valueStr.replace(/[,$\s]/g, ''));
      
    case 'transaction_date':
    case 'payment_due_date':
      // Keep date in YYYY-MM-DD format
      return valueStr;
      
    case 'vendor_name':
    case 'customer_name':
      // Trim whitespace
      return valueStr.trim();
      
    case 'reference_number':
      // Remove extra whitespace
      return valueStr.trim().replace(/\s+/g, ' ');
      
    default:
      return value;
  }
}

/**
 * Generate bookmarklet code for form autofill
 * This will be dragged to bookmark bar by user
 */
export function generateBookmarklet(formData) {
  const bookmarkletCode = `
javascript:(function(){
  const data = ${JSON.stringify(formData.form_fields)};
  const fieldMappings = {
    payee_name: ['payee', 'payto', 'recipient', 'vendor', 'company'],
    payment_amount: ['amount', 'payment', 'total', 'balance'],
    reference_number: ['reference', 'invoice', 'account', 'number'],
    payment_date: ['date', 'duedate', 'paymentdate'],
    account_holder: ['name', 'accountname', 'holder']
  };
  
  let filledCount = 0;
  
  Object.entries(data).forEach(([field, value]) => {
    const possibleNames = fieldMappings[field] || [];
    
    for (const name of possibleNames) {
      const inputs = document.querySelectorAll(
        \`input[name*="\${name}" i], 
         input[id*="\${name}" i], 
         input[placeholder*="\${name}" i]\`
      );
      
      if (inputs.length > 0) {
        inputs[0].value = value;
        inputs[0].style.backgroundColor = '#d4edda';
        filledCount++;
        break;
      }
    }
  });
  
  const notification = document.createElement('div');
  notification.style.cssText = \`
    position: fixed;
    top: 20px;
    right: 20px;
    background: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-family: system-ui;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  \`;
  notification.textContent = \`✓ Autofilled \${filledCount} field\${filledCount !== 1 ? 's' : ''}\`;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
})();
`;
  
  return bookmarkletCode.trim();
}

/**
 * Get form-ready summary
 */
export function getFormSummary(formattedData) {
  return {
    total_fields: Object.keys(formattedData.form_fields).length,
    review_required: formattedData.review_required.length,
    warnings: formattedData.warnings.length,
    ready_to_fill: formattedData.ready_to_fill
  };
}
