export default function ConfidenceBadge({ confidence }) {
  const getColor = (score) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 0.6) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getLabel = (score) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    return 'Low';
  };

  const percentage = Math.round(confidence * 100);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getColor(confidence)}`}>
      {getLabel(confidence)} ({percentage}%)
    </span>
  );
}
