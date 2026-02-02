import { useState } from 'react';
import ConfidenceBadge from './ConfidenceBadge';

export default function FieldReviewCard({ 
  label, 
  value, 
  confidence, 
  reasoning, 
  validationError,
  onSave 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const needsReview = confidence && confidence < 0.7;
  const hasError = !!validationError;

  return (
    <div className={`
      border rounded-lg p-4 transition-all duration-200
      ${needsReview 
        ? 'border-amber-300 bg-amber-50' 
        : hasError 
        ? 'border-red-300 bg-red-50'
        : 'border-gray-200 bg-white'
      }
      ${isEditing ? 'ring-2 ring-blue-500' : ''}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 block mb-1">
            {label}
          </label>
          {confidence !== undefined && (
            <ConfidenceBadge confidence={confidence} />
          )}
        </div>
        
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title={isEditing ? 'Cancel editing' : 'Edit field'}
        >
          {isEditing ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          )}
        </button>
      </div>

      {/* Value Display/Edit */}
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900"
            autoFocus
          />
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-base text-gray-900 font-medium mb-2">
          {value || <span className="text-gray-400 font-normal">Not found</span>}
        </div>
      )}

      {/* Validation Error */}
      {hasError && !isEditing && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        </div>
      )}

      {/* Reasoning */}
      {reasoning && !isEditing && !hasError && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-medium">AI Assessment:</span> {reasoning}
          </p>
        </div>
      )}

      {/* Needs Review Badge */}
      {needsReview && !isEditing && !hasError && (
        <div className="mt-3 pt-3 border-t border-amber-200">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-700 font-medium">Please review this field carefully</p>
          </div>
        </div>
      )}
    </div>
  );
}
