import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProcessingSteps from '../components/ProcessingSteps';
import ErrorBanner from '../components/ErrorBanner';
import { processDocument } from '../services/orchestrator.js';
import { saveDocument } from '../services/storageService.js';

export default function ProcessingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('extracting');
  const [message, setMessage] = useState('Starting...');
  const [state, setState] = useState(null);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    // Redirect if no file data
    if (!location.state?.imageData) {
      navigate('/');
      return;
    }

    // Start processing
    const process = async () => {
      const result = await processDocument(
        location.state.imageData,
        (progress) => {
          setCurrentStep(progress.step);
          setMessage(progress.message);
          if (progress.state) {
            setState(progress.state);
            
            // Collect errors
            const allErrors = progress.state.errors || [];
            const errorList = allErrors.filter(e => e.error);
            const warningList = allErrors.filter(e => e.warning);
            setErrors({ errors: errorList, warnings: warningList });
          }
        }
      );

      // Processing complete
      if (result.status === 'complete') {
        try {
          // Save to storage (without image to save space)
          const savedDocument = saveDocument({
            fileName: location.state.fileName,
            imageData: null, // Don't store image to save localStorage space
            extracted: result.extracted,
            validated: result.validated,
            scored: result.scored,
            formatted: result.formatted,
            costs: result.costs,
            errors: result.errors
          });
          
          // Navigate to review page
          setTimeout(() => {
            navigate(`/review/${savedDocument.id}`);
          }, 500);
        } catch (storageError) {
          console.warn('Storage full, navigating without saving:', storageError);
          
          // Create temporary document in sessionStorage for current session
          const tempDoc = {
            id: 'temp-' + Date.now(),
            fileName: location.state.fileName,
            extracted: result.extracted,
            validated: result.validated,
            scored: result.scored,
            formatted: result.formatted,
            costs: result.costs,
            errors: result.errors
          };
          
          sessionStorage.setItem('currentDocument', JSON.stringify(tempDoc));
          
          // Navigate to review page anyway
          setTimeout(() => {
            navigate(`/review/${tempDoc.id}`);
          }, 500);
        }
      } else if (result.status === 'failed') {
        // Stay on page to show errors
        console.error('Processing failed:', result.errors);
      }
    };

    process();
  }, [location.state, navigate]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Processing Invoice
        </h1>
        <p className="text-gray-600">
          {message}
        </p>
      </div>

      {/* Processing Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
        <ProcessingSteps currentStep={currentStep} />
      </div>

      {/* Errors/Warnings */}
      {errors.errors?.length > 0 || errors.warnings?.length > 0 ? (
        <ErrorBanner 
          errors={errors.errors} 
          warnings={errors.warnings} 
        />
      ) : null}

      {/* Cost Tracker */}
      {state?.costs && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">API Cost</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${state.costs.total.toFixed(4)}
              </p>
            </div>
            
            {state.costs.breakdown && (
              <div className="text-right text-sm text-gray-600">
                {state.costs.breakdown.extract && (
                  <div>Extract: ${state.costs.breakdown.extract.total_cost.toFixed(4)}</div>
                )}
                {state.costs.breakdown.score && (
                  <div>Score: ${state.costs.breakdown.score.total_cost.toFixed(4)}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {location.state?.preview && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Processing this invoice:</p>
          <img 
            src={location.state.preview} 
            alt="Invoice" 
            className="max-w-sm mx-auto rounded-lg border border-gray-200 shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
