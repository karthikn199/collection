// IndexedDB service for data persistence

const DB_NAME = "CollectionAgentDB";
const DB_VERSION = 3; // Incremented for agent mapping

const STORES = {
  COMPANIES: "companies",
  USERS: "users",
  CUSTOMERS: "customers",
  LOANS: "loans",
  MAPPINGS: "mappings",
  COLLECTIONS: "collections",
};

let dbInstance = null;

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;

      // Create Companies store
      if (!db.objectStoreNames.contains(STORES.COMPANIES)) {
        const companyStore = db.createObjectStore(STORES.COMPANIES, {
          keyPath: "id",
        });
        companyStore.createIndex("name", "name", { unique: false });
        companyStore.createIndex("email", "email", { unique: true });
      }

      // Create Users store
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        const userStore = db.createObjectStore(STORES.USERS, { keyPath: "id" });
        userStore.createIndex("companyId", "companyId", { unique: false });
        userStore.createIndex("email", "email", { unique: false });
        userStore.createIndex("role", "role", { unique: false });
        userStore.createIndex("companyEmail", ["companyId", "email"], {
          unique: true,
        });
      }

      // Create or update Customers store
      if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
        const customerStore = db.createObjectStore(STORES.CUSTOMERS, {
          keyPath: "id",
        });
        customerStore.createIndex("name", "name", { unique: false });
        customerStore.createIndex("companyId", "companyId", {
          unique: false,
        });
      } else if (oldVersion < 2) {
        // Add companyId index to existing store
        const customerStore = event.target.transaction.objectStore(
          STORES.CUSTOMERS
        );
        if (!customerStore.indexNames.contains("companyId")) {
          customerStore.createIndex("companyId", "companyId", {
            unique: false,
          });
        }
      }

      // Create or update Loans store
      if (!db.objectStoreNames.contains(STORES.LOANS)) {
        const loanStore = db.createObjectStore(STORES.LOANS, { keyPath: "id" });
        loanStore.createIndex("loanAmount", "loanAmount", { unique: false });
        loanStore.createIndex("companyId", "companyId", { unique: false });
      } else if (oldVersion < 2) {
        const loanStore = event.target.transaction.objectStore(STORES.LOANS);
        if (!loanStore.indexNames.contains("companyId")) {
          loanStore.createIndex("companyId", "companyId", { unique: false });
        }
      }

      // Create or update Mappings store
      if (!db.objectStoreNames.contains(STORES.MAPPINGS)) {
        const mappingStore = db.createObjectStore(STORES.MAPPINGS, {
          keyPath: "id",
        });
        mappingStore.createIndex("customerId", "customerId", {
          unique: false,
        });
        mappingStore.createIndex("loanId", "loanId", { unique: false });
        mappingStore.createIndex("companyId", "companyId", { unique: false });
        mappingStore.createIndex("agentId", "agentId", { unique: false });
        mappingStore.createIndex("customerLoan", ["customerId", "loanId"], {
          unique: false,
        });
      } else {
        const mappingStore = event.target.transaction.objectStore(
          STORES.MAPPINGS
        );
        if (oldVersion < 2 && !mappingStore.indexNames.contains("companyId")) {
          mappingStore.createIndex("companyId", "companyId", {
            unique: false,
          });
        }
        if (oldVersion < 3 && !mappingStore.indexNames.contains("agentId")) {
          mappingStore.createIndex("agentId", "agentId", {
            unique: false,
          });
        }
      }

      // Create or update Collections store
      if (!db.objectStoreNames.contains(STORES.COLLECTIONS)) {
        const collectionStore = db.createObjectStore(STORES.COLLECTIONS, {
          keyPath: "id",
        });
        collectionStore.createIndex("customerId", "customerId", {
          unique: false,
        });
        collectionStore.createIndex("loanId", "loanId", { unique: false });
        collectionStore.createIndex("companyId", "companyId", {
          unique: false,
        });
        collectionStore.createIndex("collectionDate", "collectionDate", {
          unique: false,
        });
        collectionStore.createIndex("customerLoan", ["customerId", "loanId"], {
          unique: false,
        });
      } else if (oldVersion < 2) {
        const collectionStore = event.target.transaction.objectStore(
          STORES.COLLECTIONS
        );
        if (!collectionStore.indexNames.contains("companyId")) {
          collectionStore.createIndex("companyId", "companyId", {
            unique: false,
          });
        }
      }
    };
  });
};

// Generic helper functions
const getAll = (storeName) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const getById = (storeName, id) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const save = (storeName, item) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(item);

        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const deleteItem = (storeName, id) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const deleteByIndex = (storeName, indexName, value) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.openCursor();

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            if (cursor.value[indexName] === value) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const deleteByCompoundIndex = (storeName, indexName, customerId, loanId) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.openCursor(
          IDBKeyRange.only([customerId, loanId])
        );

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const queryByIndex = (storeName, indexName, value) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const queryByCompoundIndex = (storeName, indexName, customerId, loanId) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll([customerId, loanId]);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

const queryByCompanyId = (storeName, companyId) => {
  return new Promise((resolve, reject) => {
    initDB()
      .then((db) => {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index("companyId");
        const request = index.getAll(companyId);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      })
      .catch(reject);
  });
};

// Storage Service API
export const storageService = {
  // Company operations
  getCompany: async (id) => {
    return await getById(STORES.COMPANIES, id);
  },

  saveCompany: async (company) => {
    return await save(STORES.COMPANIES, company);
  },

  getAllCompanies: async () => {
    return await getAll(STORES.COMPANIES);
  },

  // User operations
  getUser: async (id) => {
    return await getById(STORES.USERS, id);
  },

  saveUser: async (user) => {
    return await save(STORES.USERS, user);
  },

  getAllUsers: async () => {
    return await getAll(STORES.USERS);
  },

  getUsersByCompany: async (companyId) => {
    return await queryByCompanyId(STORES.USERS, companyId);
  },

  deleteUser: async (id) => {
    await deleteItem(STORES.USERS, id);
  },

  // Customer operations
  getCustomers: async (companyId) => {
    if (companyId) {
      return await queryByCompanyId(STORES.CUSTOMERS, companyId);
    }
    return await getAll(STORES.CUSTOMERS);
  },

  saveCustomer: async (customer) => {
    return await save(STORES.CUSTOMERS, customer);
  },

  deleteCustomer: async (id) => {
    await deleteItem(STORES.CUSTOMERS, id);
    // Also delete related mappings
    await deleteByIndex(STORES.MAPPINGS, "customerId", id);
    // Also delete related collections
    await deleteByIndex(STORES.COLLECTIONS, "customerId", id);
  },

  // Loan operations
  getLoans: async (companyId) => {
    if (companyId) {
      return await queryByCompanyId(STORES.LOANS, companyId);
    }
    return await getAll(STORES.LOANS);
  },

  saveLoan: async (loan) => {
    return await save(STORES.LOANS, loan);
  },

  deleteLoan: async (id) => {
    await deleteItem(STORES.LOANS, id);
    // Also delete related mappings
    await deleteByIndex(STORES.MAPPINGS, "loanId", id);
  },

  // Mapping operations
  getMappings: async (companyId) => {
    if (companyId) {
      return await queryByCompanyId(STORES.MAPPINGS, companyId);
    }
    return await getAll(STORES.MAPPINGS);
  },

  saveMapping: async (mapping) => {
    // Check if mapping already exists
    const existing = await queryByCompoundIndex(
      STORES.MAPPINGS,
      "customerLoan",
      mapping.customerId,
      mapping.loanId
    );

    if (existing.length > 0 && existing[0].id !== mapping.id) {
      // Update existing mapping
      mapping.id = existing[0].id;
    }

    return await save(STORES.MAPPINGS, mapping);
  },

  deleteMapping: async (customerId, loanId) => {
    await deleteByCompoundIndex(
      STORES.MAPPINGS,
      "customerLoan",
      customerId,
      loanId
    );
    // Also delete related collections
    await deleteByCompoundIndex(
      STORES.COLLECTIONS,
      "customerLoan",
      customerId,
      loanId
    );
  },

  // Collection operations
  getCollections: async (companyId) => {
    if (companyId) {
      return await queryByCompanyId(STORES.COLLECTIONS, companyId);
    }
    return await getAll(STORES.COLLECTIONS);
  },

  saveCollection: async (collection) => {
    return await save(STORES.COLLECTIONS, collection);
  },

  deleteCollection: async (id) => {
    await deleteItem(STORES.COLLECTIONS, id);
  },

  getCollectionsByMapping: async (customerId, loanId) => {
    return await queryByCompoundIndex(
      STORES.COLLECTIONS,
      "customerLoan",
      customerId,
      loanId
    );
  },
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

// Migration from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
  const STORAGE_KEYS = {
    CUSTOMERS: "collection_customers",
    LOANS: "collection_loans",
    MAPPINGS: "collection_mappings",
    COLLECTIONS: "collection_records",
  };

  try {
    // Check if migration already done
    const migrationFlag = localStorage.getItem("indexeddb_migrated");
    if (migrationFlag === "true") {
      return;
    }

    // Initialize DB first
    await initDB();

    // Migrate customers
    const customersData = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (customersData) {
      const customers = JSON.parse(customersData);
      for (const customer of customers) {
        await storageService.saveCustomer(customer);
      }
    }

    // Migrate loans
    const loansData = localStorage.getItem(STORAGE_KEYS.LOANS);
    if (loansData) {
      const loans = JSON.parse(loansData);
      for (const loan of loans) {
        await storageService.saveLoan(loan);
      }
    }

    // Migrate mappings
    const mappingsData = localStorage.getItem(STORAGE_KEYS.MAPPINGS);
    if (mappingsData) {
      const mappings = JSON.parse(mappingsData);
      for (const mapping of mappings) {
        await storageService.saveMapping(mapping);
      }
    }

    // Migrate collections
    const collectionsData = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
    if (collectionsData) {
      const collections = JSON.parse(collectionsData);
      for (const collection of collections) {
        await storageService.saveCollection(collection);
      }
    }

    // Mark migration as complete
    localStorage.setItem("indexeddb_migrated", "true");
    console.log("Migration from localStorage to IndexedDB completed");
  } catch (error) {
    console.error("Migration error:", error);
  }
};
