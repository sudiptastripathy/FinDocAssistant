export default function ErrorBanner({ errors = [], warnings = [] }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-3">
      {errors.map((error, idx) => (
        <div key={`error-${idx}`} className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-900">
                {error.title || (error.step && `Error in ${error.step}`)}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error.userMessage || error.error || error.message}
              </p>
              {process.env.NODE_ENV === 'development' && error.error && error.userMessage && (
                <details className="mt-2">
                  <summary className="text-xs text-red-600 cursor-pointer">Technical details</summary>
                  <p className="text-xs text-red-600 mt-1 font-mono">{error.error}</p>
                </details>
              )}
            </div>
          </div>
        </div>
      ))}

      {warnings.map((warning, idx) => (
        <div key={`warning-${idx}`} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-900">
                {warning.step && `Warning in ${warning.step}`}
              </h3>
              <p className="text-sm text-amber-700 mt-1">{warning.warning || warning.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
