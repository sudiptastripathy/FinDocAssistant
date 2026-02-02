import { useState } from 'react';
import { generateBookmarklet } from '../formatService.js';
import Button from './Button';

export default function BookmarkletButton({ formData, documentData }) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!formData || !formData.form_fields) {
    return null;
  }

  const bookmarkletCode = generateBookmarklet(formData);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([bookmarkletCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-autofill-${documentData?.invoice_number || 'script'}.js`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Button onClick={() => setShowModal(true)} className="w-full">
        <div className="flex items-center justify-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>Generate Bookmarklet</span>
        </div>
      </Button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Bookmarklet Generated</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Use this bookmarklet to auto-fill payment forms
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  How to use:
                </h3>
                <ol className="text-sm text-blue-800 space-y-2 ml-7 list-decimal">
                  <li>Copy the bookmarklet code below</li>
                  <li>Create a new bookmark in your browser</li>
                  <li>Paste the code as the bookmark URL</li>
                  <li>Visit your payment form and click the bookmark</li>
                  <li>The form will auto-fill with document data!</li>
                </ol>
              </div>

              {/* Data Preview */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Data to be filled:</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {Object.entries(formData.form_fields).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">{key}:</span>
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bookmarklet Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">Bookmarklet Code:</h3>
                  <button
                    onClick={handleCopy}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-xs text-green-400 font-mono break-all">
                    {bookmarkletCode}
                  </code>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button onClick={handleCopy} className="flex-1">
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  Download Script
                </Button>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Always review auto-filled data before submitting. This tool works best with standard form fields.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
