import { useState, useEffect } from 'react';
import { Link2, Trash2, History, Copy, CheckCircle2, XCircle, Zap, Sun, Moon } from 'lucide-react';
import Loader from './components/Loader';

// API URL configuration - auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_URL = isLocalhost 
  ? '/api/fetch-links'  // Local dev (Vite proxy to localhost:3001)
  : 'https://gdfetcher789-gd1.hf.space/api/fetch-links';  // Production (Hugging Face)

function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('gd-fetcher-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('gd-fetcher-theme');
    return saved ? saved === 'dark' : true; // Default to dark
  });
  const [speedMetrics, setSpeedMetrics] = useState(null);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('gd-fetcher-history', JSON.stringify(history));
  }, [history]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('gd-fetcher-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const handleFetch = async () => {
    setResults([]);
    setError(null);
    setSpeedMetrics(null);
    const startTime = Date.now();
    
    const links = inputText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (links.length === 0) {
      setError('Please paste at least one driveseed.org link');
      return;
    }
    
    const invalidLinks = links.filter(link => !link.includes('driveseed.org'));
    if (invalidLinks.length > 0) {
      setError('Invalid links detected. All links must be from driveseed.org');
      return;
    }
    
    setIsLoading(true);
    setProgress({ processed: 0, total: links.length });
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links })
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      const totalTime = Date.now() - startTime;
      
      if (data.results) {
        setResults(data.results);
        // Calculate speed metrics
        const successfulResults = data.results.filter(r => r.status === 'success');
        const avgTime = successfulResults.length > 0 
          ? Math.round(totalTime / successfulResults.length) 
          : 0;
        setSpeedMetrics({
          totalTime,
          avgTime,
          linksPerSecond: (data.results.length / (totalTime / 1000)).toFixed(1)
        });
        
        // Add successful results to history
        const newHistoryItems = data.results
          .filter(r => r.status === 'success' && r.finalLink)
          .map(r => ({
            id: Date.now() + Math.random(),
            originalLink: r.originalLink,
            finalLink: r.finalLink,
            timestamp: new Date().toLocaleString()
          }));
        
        if (newHistoryItems.length > 0) {
          setHistory(prev => [...newHistoryItems, ...prev].slice(0, 100)); // Keep last 100
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch links. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (link, index) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      alert('Failed to copy');
    }
  };

  const handleCopyAll = () => {
    const links = results
      .filter(r => r.status === 'success' && r.finalLink)
      .map(r => r.finalLink)
      .join('\n');
    
    if (links) {
      navigator.clipboard.writeText(links);
      alert('All links copied!');
    }
  };

  const handleCopyHistory = () => {
    const links = history.map(h => h.finalLink).join('\n');
    if (links) {
      navigator.clipboard.writeText(links);
      alert('All history links copied!');
    }
  };

  const clearHistory = async () => {
    if (confirm('Clear all history and cache?')) {
      // Clear history state
      setHistory([]);
      
      // Clear localStorage completely for this app
      localStorage.removeItem('gd-fetcher-history');
      localStorage.removeItem('gd-fetcher-theme');
      
      // Clear all results and progress
      setResults([]);
      setProgress({ processed: 0, total: 0 });
      setSpeedMetrics(null);
      setError(null);
      
      // Clear browser cache for the API
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            if (cacheName.includes('gd-fetcher') || cacheName.includes('api')) {
              caches.delete(cacheName);
            }
          });
        });
      }
      
      // Clear session storage
      sessionStorage.clear();
      
      // Clear server-side cache (Hugging Face backend)
      try {
        const baseURL = API_URL.replace('/api/fetch-links', '');
        await fetch(`${baseURL}/api/clear-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        // Silent fail - server cache clear is optional
      }
      
      console.log('[CLEAR] All cache and history cleared (frontend + backend)');
    }
  };

  const removeHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const successfulCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;

  const themeClasses = darkMode
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white'
    : 'bg-gradient-to-br from-slate-100 via-white to-slate-100 text-slate-900';

  const cardClasses = darkMode
    ? 'bg-slate-900/50 border-slate-800'
    : 'bg-white/80 border-slate-200 shadow-xl';

  const inputClasses = darkMode
    ? 'bg-slate-950/50 border-slate-700 text-white placeholder-slate-600 focus:ring-blue-500/50'
    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:ring-blue-500/50';

  const historyCardClasses = darkMode
    ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
    : 'bg-slate-50 border-slate-200 hover:border-slate-300';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeClasses}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${darkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'}`} />
        <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${darkMode ? 'bg-purple-500/10' : 'bg-purple-400/20'}`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="text-center flex-1">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg shadow-blue-500/25">
                <Link2 className="w-8 h-8 text-white" />
              </div>
              <h1 className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${darkMode ? 'from-white via-blue-100 to-white' : 'from-slate-900 via-blue-600 to-slate-900'} bg-clip-text text-transparent`}>
                GD Links Fetcher
              </h1>
            </div>
            <p className={darkMode ? 'text-slate-400 text-lg' : 'text-slate-600 text-lg'}>
              Extract direct download links from driveseed.org instantly
            </p>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-xl transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-yellow-400' : 'bg-white hover:bg-slate-100 text-orange-500 shadow-md'}`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* Main Card */}
        <div className={`backdrop-blur-xl border rounded-2xl p-6 sm:p-8 shadow-2xl transition-colors duration-300 ${cardClasses}`}>
          {/* Input */}
          <div className="mb-6">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Paste driveseed.org links (one per line)
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              placeholder="https://driveseed.org/file/abc123&#10;https://driveseed.org/file/xyz456"
              className={`w-full h-40 border rounded-xl p-4 focus:outline-none focus:ring-2 focus:border-transparent resize-none font-mono text-sm transition-all disabled:opacity-50 ${inputClasses}`}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleFetch}
              disabled={isLoading || !inputText.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <>
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Fetch Links
                </>
              )}
            </button>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center justify-center gap-2 py-4 px-6 font-semibold rounded-xl transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
            >
              <History className="w-5 h-5" />
              History ({history.length})
            </button>
          </div>

          {/* Progress */}
          {isLoading && (
            <div className="mt-6">
              <Loader />
              <div className={`flex justify-between text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span>Processing links...</span>
                <span>{progress.processed} / {progress.total}</span>
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress.total ? (progress.processed / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className={`mt-6 p-4 border rounded-xl flex items-center gap-3 ${darkMode ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Current Results */}
          {results.length > 0 && !isLoading && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Results</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {successfulCount}
                  </span>
                  <span className="text-red-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {failedCount}
                  </span>
                </div>
              </div>

              {/* Speed Metrics */}
              {speedMetrics && (
                <div className={`mb-4 p-3 rounded-xl border ${darkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-center gap-6 text-sm">
                    <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                      <strong>Total:</strong> {(speedMetrics.totalTime / 1000).toFixed(1)}s
                    </span>
                    <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                      <strong>Avg:</strong> {speedMetrics.avgTime}ms per link
                    </span>
                    <span className={darkMode ? 'text-blue-400' : 'text-blue-600'}>
                      <strong>Speed:</strong> {speedMetrics.linksPerSecond} links/sec
                    </span>
                  </div>
                </div>
              )}

              {successfulCount > 0 && (
                <button
                  onClick={handleCopyAll}
                  className={`mb-4 w-full py-3 border font-medium rounded-xl transition-all flex items-center justify-center gap-2 ${darkMode ? 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-100 hover:bg-green-200 border-green-300 text-green-700'}`}
                >
                  <Copy className="w-4 h-4" />
                  Copy All Successful Links
                </button>
              )}

              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border transition-all ${
                      result.status === 'success' 
                        ? (darkMode ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-slate-300')
                        : (darkMode ? 'bg-red-500/5 border-red-500/20' : 'bg-red-50 border-red-200')
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        result.status === 'success' 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                          : (darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs mb-1 truncate ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{result.originalLink}</p>
                        {result.status === 'success' ? (
                          <p className={`text-sm font-mono truncate ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} title={result.finalLink}>
                            {result.finalLink}
                          </p>
                        ) : (
                          <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{result.error || 'Failed to extract'}</p>
                        )}
                        {result.duration && (
                          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                            {result.duration}ms {result.cached && '(cached)'}
                          </p>
                        )}
                      </div>
                      {result.status === 'success' && (
                        <button
                          onClick={() => handleCopy(result.finalLink, index)}
                          className={`flex-shrink-0 p-2 rounded-lg transition-all ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                          {copiedIndex === index ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* History Panel */}
        {showHistory && (
          <div className={`mt-8 backdrop-blur-xl border rounded-2xl p-6 sm:p-8 shadow-2xl animate-in slide-in-from-top-4 duration-300 ${cardClasses}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <History className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>History</h2>
                <span className={`px-2 py-1 rounded-lg text-sm ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>{history.length} items</span>
              </div>
              <div className="flex gap-2">
                {history.length > 0 && (
                  <>
                    <button
                      onClick={handleCopyHistory}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${darkMode ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                    >
                      <Copy className="w-4 h-4" />
                      Copy All
                    </button>
                    <button
                      onClick={clearHistory}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${darkMode ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {history.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>No history yet. Fetch some links to see them here.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 border rounded-xl transition-all group ${historyCardClasses}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{item.originalLink}</p>
                        <p className={`text-sm font-mono truncate ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} title={item.finalLink}>
                          {item.finalLink}
                        </p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>{item.timestamp}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(item.finalLink, `hist-${item.id}`)}
                          className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'}`}
                        >
                          <Copy className={`w-4 h-4 ${darkMode ? '' : 'text-slate-700'}`} />
                        </button>
                        <button
                          onClick={() => removeHistoryItem(item.id)}
                          className={`p-2 rounded-lg transition-all ${darkMode ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <p className={`text-center text-sm mt-8 ${darkMode ? 'text-slate-600' : 'text-slate-500'}`}>
          Supports batch processing • Auto-retry on failure • Local history storage
        </p>
      </div>
    </div>
  );
}

export default App;
