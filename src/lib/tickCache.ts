/**
 * Caches the raw tick data file as a Blob in IndexedDB.
 * Storing the raw file (~MBs) is far cheaper than serializing
 * millions of parsed Tick objects (which causes OOM).
 */

const DB_NAME = 'tickview';
const DB_VERSION = 1;
const STORE_NAME = 'files';
const CACHE_KEY = 'last';

interface CacheEntry {
  key: string;
  fileName: string;
  blob: Blob;
  savedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // Drop old store if schema changed
      if (db.objectStoreNames.contains('ticks')) {
        db.deleteObjectStore('ticks');
      }
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFile(fileName: string, file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entry: CacheEntry = {
      key: CACHE_KEY,
      fileName,
      blob: new Blob([file], { type: file.type }),
      savedAt: Date.now(),
    };
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

export async function loadCachedFile(): Promise<{ fileName: string; file: File } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      let tx: IDBTransaction;
      try { tx = db.transaction(STORE_NAME, 'readonly'); } catch { resolve(null); return; }
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(CACHE_KEY);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry | undefined;
        if (entry && entry.blob.size > 0) {
          const file = new File([entry.blob], entry.fileName, { type: entry.blob.type });
          resolve({ fileName: entry.fileName, file });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch {
    return null;
  }
}
