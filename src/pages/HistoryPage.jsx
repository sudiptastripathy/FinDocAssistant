import { Link } from 'react-router-dom';
import { getAllDocuments } from '../services/storageService.js';
import Button from '../components/Button';

export default function HistoryPage() {
  const invoices = getAllDocuments();

  if (invoices.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No documents yet</h2>
        <p className="text-gray-600 mb-6">Upload your first financial document to get started</p>
        <Link to="/">
          <Button>Upload Document</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document History</h1>
          <p className="text-gray-600 mt-1">{invoices.length} document(s) processed</p>
        </div>
        <Link to="/">
          <Button>Upload New Document</Button>
        </Link>
      </div>

      {/* Invoice Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((invoice) => (
          <Link 
            key={invoice.id} 
            to={`/review/${invoice.id}`}
            className="block group"
          >
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Image Preview */}
              <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                <img 
                  src={invoice.imageData} 
                  alt={invoice.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate mb-2">
                  {invoice.extracted?.vendor_name || invoice.fileName}
                </h3>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium text-gray-900">
                      {invoice.extracted?.currency || '$'} {invoice.extracted?.amount_due || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Invoice #:</span>
                    <span className="text-gray-700 truncate ml-2">
                      {invoice.extracted?.invoice_number || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Due Date:</span>
                    <span className="text-gray-700">
                      {invoice.extracted?.due_date || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${invoice.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                    }
                  `}>
                    {invoice.status || 'unpaid'}
                  </span>
                  
                  <span className="text-xs text-gray-400">
                    {new Date(invoice.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
