import { Link, useLocation } from 'react-router-dom';
import { logger } from '../services/logger.js';

export default function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleDownloadLogs = () => {
    logger.downloadLogs();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-bold">$</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">Document Assistant</span>
              </Link>
              
              <nav className="hidden md:flex space-x-1">
                <Link
                  to="/"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Upload
                </Link>
                <Link
                  to="/history"
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/history') 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  History
                </Link>
              </nav>
            </div>
            
            {/* Debug: Download Logs Button (Development only) */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleDownloadLogs}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 border border-gray-300 rounded"
                title="Download error logs for debugging"
              >
                📥 Logs
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
