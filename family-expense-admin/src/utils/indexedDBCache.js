/**
 * IndexedDB Caching Service for offline data persistence
 */

const DB_NAME = 'FamilyExpenseCache';
const DB_VERSION = 1;

// Store names
const STORES = {
  EXPENSES: 'expenses',
  FAMILY_MEMBERS: 'familyMembers',
  METADATA: 'metadata'
};

let dbInstance = null;

/**
 * Initialize and get the database instance
 */
const getDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create expenses store
      if (!db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expenseStore = db.createObjectStore(STORES.EXPENSES, { keyPath: 'id' });
        expenseStore.createIndex('yearMonth', ['year', 'month'], { unique: false });
        expenseStore.createIndex('paidBy', 'paidBy', { unique: false });
        expenseStore.createIndex('category', 'category', { unique: false });
      }

      // Create family members store
      if (!db.objectStoreNames.contains(STORES.FAMILY_MEMBERS)) {
        db.createObjectStore(STORES.FAMILY_MEMBERS, { keyPath: 'id' });
      }

      // Create metadata store (for cache timestamps, etc.)
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };
  });
};

/**
 * Save expenses to IndexedDB
 */
export const cacheExpenses = async (expenses) => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.EXPENSES, 'readwrite');
    const store = transaction.objectStore(STORES.EXPENSES);

    // Clear existing and add new
    store.clear();
    expenses.forEach(expense => {
      store.add(expense);
    });

    // Update cache timestamp
    const metaStore = db.transaction(STORES.METADATA, 'readwrite')
      .objectStore(STORES.METADATA);
    metaStore.put({
      key: 'expensesCacheTime',
      value: Date.now()
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to cache expenses:', error);
    return false;
  }
};

/**
 * Get cached expenses from IndexedDB
 */
export const getCachedExpenses = async () => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.EXPENSES, 'readonly');
    const store = transaction.objectStore(STORES.EXPENSES);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached expenses:', error);
    return [];
  }
};

/**
 * Save family members to IndexedDB
 */
export const cacheFamilyMembers = async (members) => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.FAMILY_MEMBERS, 'readwrite');
    const store = transaction.objectStore(STORES.FAMILY_MEMBERS);

    // Clear existing and add new
    store.clear();
    members.forEach(member => {
      store.add(member);
    });

    // Update cache timestamp
    const metaStore = db.transaction(STORES.METADATA, 'readwrite')
      .objectStore(STORES.METADATA);
    metaStore.put({
      key: 'membersCacheTime',
      value: Date.now()
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to cache family members:', error);
    return false;
  }
};

/**
 * Get cached family members from IndexedDB
 */
export const getCachedFamilyMembers = async () => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.FAMILY_MEMBERS, 'readonly');
    const store = transaction.objectStore(STORES.FAMILY_MEMBERS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cached family members:', error);
    return [];
  }
};

/**
 * Get cache metadata
 */
export const getCacheMetadata = async (key) => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.METADATA, 'readonly');
    const store = transaction.objectStore(STORES.METADATA);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get cache metadata:', error);
    return null;
  }
};

/**
 * Check if cache is stale (older than maxAge in milliseconds)
 */
export const isCacheStale = async (key, maxAge = 5 * 60 * 1000) => {
  const cacheTime = await getCacheMetadata(key);
  if (!cacheTime) return true;
  return (Date.now() - cacheTime) > maxAge;
};

/**
 * Add a single expense to cache (for optimistic updates)
 */
export const addExpenseToCache = async (expense) => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.EXPENSES, 'readwrite');
    const store = transaction.objectStore(STORES.EXPENSES);
    store.put(expense);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to add expense to cache:', error);
    return false;
  }
};

/**
 * Update an expense in cache
 */
export const updateExpenseInCache = async (expense) => {
  return addExpenseToCache(expense);
};

/**
 * Delete an expense from cache
 */
export const deleteExpenseFromCache = async (expenseId) => {
  try {
    const db = await getDB();
    const transaction = db.transaction(STORES.EXPENSES, 'readwrite');
    const store = transaction.objectStore(STORES.EXPENSES);
    store.delete(expenseId);

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('Failed to delete expense from cache:', error);
    return false;
  }
};

/**
 * Clear all cached data
 */
export const clearCache = async () => {
  try {
    const db = await getDB();

    const expenseTx = db.transaction(STORES.EXPENSES, 'readwrite');
    expenseTx.objectStore(STORES.EXPENSES).clear();

    const membersTx = db.transaction(STORES.FAMILY_MEMBERS, 'readwrite');
    membersTx.objectStore(STORES.FAMILY_MEMBERS).clear();

    const metaTx = db.transaction(STORES.METADATA, 'readwrite');
    metaTx.objectStore(STORES.METADATA).clear();

    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
};

/**
 * Check if IndexedDB is available
 */
export const isIndexedDBAvailable = () => {
  return 'indexedDB' in window;
};

/**
 * Get cache statistics
 */
export const getCacheStats = async () => {
  try {
    const expenses = await getCachedExpenses();
    const members = await getCachedFamilyMembers();
    const expensesCacheTime = await getCacheMetadata('expensesCacheTime');
    const membersCacheTime = await getCacheMetadata('membersCacheTime');

    return {
      expenseCount: expenses.length,
      memberCount: members.length,
      expensesCacheTime: expensesCacheTime ? new Date(expensesCacheTime) : null,
      membersCacheTime: membersCacheTime ? new Date(membersCacheTime) : null
    };
  } catch (error) {
    console.error('Failed to get cache stats:', error);
    return null;
  }
};
