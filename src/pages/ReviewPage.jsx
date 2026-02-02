import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDocumentById, updateDocument } from '../services/storageService.js';
import FieldReviewCard from '../components/FieldReviewCard';
import CostTracker from '../components/CostTracker';
import Button from '../components/Button';

export default function ReviewPage() {
  const { id } = useParams();
  
  // Try to get document from localStorage first, then sessionStorage
  const getDocument = () => {
    const doc = getDocumentById(id);
    if (doc) return doc;
    
    // Check if it's a temporary document
    if (id.startsWith('temp-')) {
      const tempDoc = sessionStorage.getItem('currentDocument');
      return tempDoc ? JSON.parse(tempDoc) : null;
    }
    
    return null;
  };
  
  const [invoice, setInvoice] = useState(getDocument());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Document not found</p>
        <Link to="/" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          Go home
        </Link>
      </div>
    );
  }

  const extractedData = invoice.extracted || {};
  const validatedData = invoice.validated || {};
  const scoredData = invoice.scored || {};
  const formattedData = invoice.formatted || {};
  const userEdits = invoice.userEdits || {};

  // Merge extracted data with user edits
  const displayData = { ...extractedData, ...userEdits };

  const handleFieldSave = (fieldName, newValue) => {
    const updatedEdits = { ...userEdits, [fieldName]: newValue };
    
    // Update document with user edits
    const updatedInvoice = updateDocument(id, {
      userEdits: updatedEdits
    });
    
    setInvoice(updatedInvoice);
    setHasUnsavedChanges(false);
  };

  const reviewRequiredCount = formattedData.review_required?.length || 0;
  const hasWarnings = invoice.errors?.some(e => e.warning) || false;

  const handleCopyToClipboard = () => {
    const text = Object.entries(displayData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    navigator.clipboard.writeText(text);
    alert('Invoice data copied to clipboard!');
  };

  const handleExportJSON = () => {
    const dataToExport = {
      invoice_data: displayData,
      validation: validatedData,
      confidence_scores: scoredData,
      metadata: {
        file_name: invoice.fileName,
        upload_date: invoice.uploadDate,
        extraction_quality: extractedData.extraction_quality,
        document_type: extractedData.document_type
      }
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${displayData.invoice_number || 'data'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Review Document</h1>
              {reviewRequiredCount > 0 && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                  {reviewRequiredCount} field{reviewRequiredCount > 1 ? 's' : ''} need review
                </span>
              )}
            </div>
            <p className="text-gray-600">
              {invoice.fileName}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Uploaded {new Date(invoice.uploadDate).toLocaleString()}
            </p>
          </div>
          
          <Link to="/history">
            <Button variant="secondary">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to History</span>
              </div>
            </Button>
          </Link>
        </div>

        {/* Status Bar */}
        {(hasWarnings || reviewRequiredCount > 0) && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-900">Review Recommended</p>
                <p className="text-sm text-amber-700 mt-1">
                  Some fields have low confidence scores. Please verify the data before using the bookmarklet.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Invoice Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Original Invoice</h2>
            <img 
              src={invoice.imageData} 
              alt="Invoice" 
              className="w-full rounded-lg border border-gray-200"
            />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Extraction Quality</p>
                <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                  {extractedData.extraction_quality || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Document Type</p>
                <p className="text-sm font-medium text-gray-900 mt-1 capitalize">
                  {extractedData.document_type || 'N/A'}
                </p>
              </div>
            </div>
            
            {/* Cost Tracker */}
            <div className="mt-4">
              <CostTracker costs={invoice.costs} />
            </div>
          </div>
        </div>

        {/* Right: Extracted Data */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Extracted Data</h2>
              <span className="text-xs text-gray-500">Click pencil to edit</span>
            </div>
            
            <div className="space-y-4">
              {[
                { key: 'vendor_name', label: 'Vendor Name' },
                { key: 'invoice_number', label: 'Invoice Number' },
                { key: 'invoice_date', label: 'Invoice Date' },
                { key: 'due_date', label: 'Due Date' },
                { key: 'amount_due', label: 'Amount Due' },
                { key: 'currency', label: 'Currency' },
              ].map(({ key, label }) => {
                const value = displayData[key];
                const score = scoredData[key];
                const validation = validatedData[key];
                
                return (
                  <FieldReviewCard
                    key={key}
                    label={label}
                    value={value}
                    confidence={score?.confidence}
                    reasoning={score?.reasoning}
                    validationError={validation?.valid === false ? validation.error : null}
                    onSave={(newValue) => handleFieldSave(key, newValue)}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={handleCopyToClipboard} className="w-full">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Data to Clipboard</span>
              </div>
            </Button>
            
            <Button onClick={handleExportJSON} variant="outline" className="w-full">
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export as JSON</span>
              </div>
            </Button>
          </div>

          {/* Optional Fields */}
          {(displayData.customer_name || displayData.customer_address) && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Additional Information</h3>
              <div className="space-y-3">
                {displayData.customer_name && (
                  <FieldReviewCard
                    label="Customer Name"
                    value={displayData.customer_name}
                    confidence={scoredData.customer_name?.confidence}
                    reasoning={scoredData.customer_name?.reasoning}
                    onSave={(newValue) => handleFieldSave('customer_name', newValue)}
                  />
                )}
                {displayData.customer_address && (
                  <FieldReviewCard
                    label="Customer Address"
                    value={displayData.customer_address}
                    confidence={scoredData.customer_address?.confidence}
                    reasoning={scoredData.customer_address?.reasoning}
                    onSave={(newValue) => handleFieldSave('customer_address', newValue)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
