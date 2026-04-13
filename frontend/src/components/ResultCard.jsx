import { useState } from 'react';

function ResultCard({ index, result }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    if (result.finalLink) {
      try {
        await navigator.clipboard.writeText(result.finalLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
      }
    }
  };
  
  const isSuccess = result.status === 'success' && result.finalLink;
  
  // Truncate link for display
  const displayLink = result.finalLink 
    ? result.finalLink.length > 60 
      ? result.finalLink.substring(0, 60) + '...'
      : result.finalLink
    : 'Failed to extract';
  
  return (
    <div className={`p-4 rounded-lg border ${
      isSuccess 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-red-900/20 border-red-800'
    }`}>
      <div className="flex items-center justify-between gap-4">
        {/* Serial Number */}
        <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
          <span className="text-sm font-semibold text-white">{index + 1}</span>
        </div>
        
        {/* Link Display */}
        <div className="flex-grow min-w-0">
          <p className="text-xs text-gray-500 mb-1 truncate">
            {result.originalLink}
          </p>
          <p className={`font-mono text-sm truncate ${
            isSuccess ? 'text-green-400' : 'text-red-400'
          }`}>
            {isSuccess ? displayLink : (result.error || 'Failed')}
          </p>
        </div>
        
        {/* Status Badge & Copy Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status Badge */}
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isSuccess 
              ? 'bg-green-900/50 text-green-400 border border-green-700' 
              : 'bg-red-900/50 text-red-400 border border-red-700'
          }`}>
            {isSuccess ? 'Success' : 'Failed'}
          </span>
          
          {/* Copy Button */}
          {isSuccess && (
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultCard;
