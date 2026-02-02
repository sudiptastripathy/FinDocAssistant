// src/services/storageService.js

// Simple UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const STORAGE_KEY = 'invoices'; // Legacy key name for backward compatibility

/**
 * Get all documents from LocalStorage
 */
export function getAllDocuments() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading from storage:', error);
    return [];
  }
}

// Alias for backward compatibility
export const getAllInvoices = getAllDocuments;

/**
 * Get document by ID
 */
export function getDocumentById(id) {
  const documents = getAllDocuments();
  return documents.find(doc => doc.id === id);
}

// Alias for backward compatibility
export const getInvoiceById = getDocumentById;

/**
 * Save new document
 */
export function saveDocument(documentData) {
  try {
    const documents = getAllDocuments();
    
    const newDocument = {
      id: generateUUID(),
      uploadDate: new Date().toISOString(),
      fileName: documentData.fileName,
      imageData: documentData.imageData, // Base64 image
      
      // Pipeline results
      extracted: documentData.extracted,
      validated: documentData.validated,
      scored: documentData.scored,
      formatted: documentData.formatted,
      
      // Metadata
      costs: documentData.costs,
      errors: documentData.errors || [],
      
      // Status tracking
      status: 'unpaid', // unpaid, paid, overdue
      paidDate: null,
      
      // User edits
      userEdits: {}
    };
    
    documents.push(newDocument);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    
    return newDocument;
  } catch (error) {
    console.error('Error saving document:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const saveInvoice = saveDocument;

/**
 * Update existing document
 */
export function updateDocument(id, updates) {
  try {
    const documents = getAllDocuments();
    const index = documents.findIndex(doc => doc.id === id);
    
    if (index === -1) {
      throw new Error('Document not found');
    }
    
    documents[index] = {
      ...documents[index],
      ...updates,
      updatedDate: new Date().toISOString()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
    return documents[index];
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const updateInvoice = updateDocument;

/**
 * Mark document as paid
 */
export function markDocumentAsPaid(id) {
  return updateDocument(id, {
    status: 'paid',
    paidDate: new Date().toISOString()
  });
}

// Alias for backward compatibility
export const markInvoiceAsPaid = markDocumentAsPaid;

/**
 * Delete document
 */
export function deleteDocument(id) {
  try {
    const documents = getAllDocuments();
    const filtered = documents.filter(doc => doc.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
}

// Alias for backward compatibility
export const deleteInvoice = deleteDocument;

/**
 * Get documents filtered by status
 */
export function getDocumentsByStatus(status) {
  const documents = getAllDocuments();
  
  if (status === 'all') {
    return documents;
  }
  
  return documents.filter(doc => {
    if (status === 'overdue') {
      return doc.status === 'unpaid' && isOverdue(doc);
    }
    return doc.status === status;
  });
}

// Alias for backward compatibility
export const getInvoicesByStatus = getDocumentsByStatus;

/**
 * Check if document is overdue
 */
function isOverdue(document) {
  if (!document.extracted?.due_date) {
    return false;
  }
  
  const dueDate = new Date(document.extracted.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dueDate < today;
}

/**
 * Update status for all invoices (check for overdue)
 */
export function updateInvoiceStatuses() {
  const invoices = getAllInvoices();
  let updated = false;
  
  invoices.forEach(invoice => {
    if (invoice.status === 'unpaid' && isOverdue(invoice)) {
      invoice.status = 'overdue';
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
  }
  
  return updated;
}

/**
 * Get storage statistics
 */
export function getStorageStats() {
  const invoices = getAllInvoices();
  
  const stats = {
    total: invoices.length,
    unpaid: 0,
    paid: 0,
    overdue: 0,
    totalCost: 0,
    averageCost: 0
  };
  
  invoices.forEach(inv => {
    if (inv.status === 'paid') stats.paid++;
    else if (isOverdue(inv)) stats.overdue++;
    else if (inv.status === 'unpaid') stats.unpaid++;
    
    stats.totalCost += inv.costs?.total || 0;
  });
  
  stats.averageCost = stats.total > 0 ? stats.totalCost / stats.total : 0;
  
  return stats;
}

/**
 * Clear all data (for testing)
 */
export function clearAllInvoices() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Clear old documents to free up space
 * Keeps only the most recent N documents
 */
export function clearOldDocuments(keepCount = 10) {
  try {
    const documents = getAllDocuments();
    
    if (documents.length <= keepCount) {
      return; // Nothing to clear
    }
    
    // Sort by upload date (newest first)
    documents.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    // Keep only the most recent ones
    const toKeep = documents.slice(0, keepCount);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toKeep));
    
    return documents.length - keepCount; // Return number of documents cleared
  } catch (error) {
    console.error('Error clearing old documents:', error);
    return 0;
  }
}

export const clearAllDocuments = clearAllInvoices;
