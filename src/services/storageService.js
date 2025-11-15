// IndexedDB service for data persistence
// Re-export from indexedDBService for backward compatibility
export {
  generateId,
  initDB,
  migrateFromLocalStorage,
  storageService,
} from "./indexedDBService";
