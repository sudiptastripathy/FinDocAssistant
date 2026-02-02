export default function ProcessingSteps({ currentStep, steps }) {
  const defaultSteps = [
    { id: 'extracting', label: 'Extracting', description: 'Reading document data' },
    { id: 'validating', label: 'Validating', description: 'Checking data quality' },
    { id: 'scoring', label: 'Scoring', description: 'Calculating confidence' },
    { id: 'formatting', label: 'Formatting', description: 'Preparing output' }
  ];

  const stepsToShow = steps || defaultSteps;

  const getStepStatus = (stepId) => {
    const stepIndex = stepsToShow.findIndex(s => s.id === stepId);
    const currentIndex = stepsToShow.findIndex(s => s.id === currentStep);

    if (currentIndex === -1) return 'pending';
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {stepsToShow.map((step, index) => {
          const status = getStepStatus(step.id);
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  transition-all duration-300 border-2
                  ${status === 'complete' 
                    ? 'bg-green-500 border-green-500' 
                    : status === 'active'
                    ? 'bg-blue-500 border-blue-500 animate-pulse'
                    : 'bg-gray-100 border-gray-300'
                  }
                `}>
                  {status === 'complete' ? (
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : status === 'active' ? (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  )}
                </div>
                
                <div className="mt-3 text-center">
                  <p className={`
                    text-sm font-medium
                    ${status === 'active' ? 'text-blue-600' : status === 'complete' ? 'text-green-600' : 'text-gray-500'}
                  `}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < stepsToShow.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 mb-12">
                  <div className={`
                    h-full transition-all duration-300
                    ${getStepStatus(stepsToShow[index + 1].id) !== 'pending' 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                    }
                  `}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
