export default function CostTracker({ costs }) {
  if (!costs || !costs.total) {
    return null;
  }

  const formatCost = (cost) => {
    return cost < 0.01 ? cost.toFixed(6) : cost.toFixed(4);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-700">API Cost</span>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            ${formatCost(costs.total)}
          </div>
          
          {costs.breakdown && (
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              {costs.breakdown.extract && (
                <div>Extract: ${formatCost(costs.breakdown.extract.total_cost)}</div>
              )}
              {costs.breakdown.score && (
                <div>Score: ${formatCost(costs.breakdown.score.total_cost)}</div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {costs.breakdown?.extract && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Input tokens:</span>
              <span className="text-gray-900 ml-1 font-medium">
                {costs.breakdown.extract.input_tokens?.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Output tokens:</span>
              <span className="text-gray-900 ml-1 font-medium">
                {costs.breakdown.extract.output_tokens?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
