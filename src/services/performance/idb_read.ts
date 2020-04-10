import {generateString, fakeGithubResponse} from 'services/mock_data';
import {PerformanceTestCase} from 'services/performance/performance';
import {logError} from 'services/logger';

function prep(iteration: number, blob: string | object) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('idb-playground-benchmark', 1);
    request.onerror = () => {
      const msg = request.error!.message;
      logError(msg, 'idb_read');
      reject(msg);
    };
    request.onupgradeneeded = () => {
      const db = request.result as IDBDatabase;
      db.createObjectStore('entries', {
        keyPath: 'key',
      });
    };

    request.onsuccess = () => {
      const db = request.result as IDBDatabase;
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');
      for (let i = 0; i < iteration; ++i) {
        store.add({key: `doc_${i}`, blob});
      }
      transaction.onerror = (e) => {
        const msg = (e.target as any).error!.message;
        logError(msg, 'idb_read');
        reject(msg);
      };
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
    };
  });
}

function cleanup() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('idb-playground-benchmark');
    request.onerror = () => {
      const msg = request.error!.message;
      logError(msg, 'idb_read');
      reject(msg);
    };
    request.onsuccess = () => {
      resolve();
    };
  });
}

function benchmarkReadGetOne() {
  return new Promise<number>((resolve, reject) => {
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = () => {
      const results: Record<string, {}> = {};
      const db = request.result;
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const getRequest = store.get('doc_1');
      getRequest.onsuccess = () => {
        results['doc_1'] = getRequest.result;
        const end = performance.now();
        db.close();
        resolve(end - start);
      };
      getRequest.onerror = () => {
        const msg = getRequest.error!.message;
        logError(msg, 'idb_read');
        reject(msg);
      };
    };
  });
}

function benchmarkReadGetAll() {
  return new Promise<number>((resolve, reject) => {
    const results: Record<string, {}> = {};
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = () => {
      const db = request.result;
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result;
        items.forEach((item: {key: string; blob: string}) => {
          results[item.key] = item.blob;
        });
        const end = performance.now();
        db.close();
        resolve(end - start);
      };
      getAllRequest.onerror = () => {
        const msg = getAllRequest.error!.message;
        logError(msg, 'idb_read');
        reject(msg);
      };
    };
  });
}

function benchmarkReadCursor() {
  return new Promise<number>((resolve, reject) => {
    const results: Record<string, {}> = {};
    const request = indexedDB.open('idb-playground-benchmark', 1);

    request.onsuccess = (e) => {
      const db = request.result;
      const start = performance.now();
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          results[cursor.key as string] = cursor.value;
          cursor.continue();
        } else {
          const end = performance.now();
          db.close();
          resolve(end - start);
        }
      };
      cursorRequest.onerror = () => {
        const msg = cursorRequest.error!.message;
        logError(msg, 'idb_read');
        reject(msg);
      };
    };
  });
}

const baseCase = {
  // idb tests are really slow. Only run 100 iterations.
  iteration: 100,
  cleanup,
};

const readJSON: PerformanceTestCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetOne(),
  name: 'idbReadJSON',
  label: 'idb read 70KB JSON',
  prep: () => prep(10, fakeGithubResponse),
};

const read1MB: PerformanceTestCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetOne(),
  name: 'idbRead1MB',
  label: 'idb read 1MB',
  prep: () => prep(10, generateString(1024)),
};

const read1KB: PerformanceTestCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetOne(),
  name: 'idbRead1KB',
  label: 'idb read 1KB',
  prep: () => prep(10, generateString(1)),
};

const getAllBaseCase = {
  ...baseCase,
  benchmark: () => benchmarkReadGetAll(),
};

const read1024x100BGetAll: PerformanceTestCase = {
  ...getAllBaseCase,
  name: 'idbRead1024x100BGetAll',
  label: 'idb read 1024x100B with getAll',
  prep: () => prep(1024, generateString(100 / 1024)),
};

const read100x1KBGetAll: PerformanceTestCase = {
  ...getAllBaseCase,
  name: 'idbRead100x1KBGetAll',
  label: 'idb read 100x1KB with getAll',
  prep: () => prep(100, generateString(1)),
};

const cursorBaseCase = {
  ...baseCase,
  benchmark: () => benchmarkReadCursor(),
};

const read1024x100BCursor: PerformanceTestCase = {
  ...cursorBaseCase,
  name: 'idbRead1024x100BCursor',
  label: 'idb read 1024x100B with cursor',
  prep: () => prep(1024, generateString(100 / 1024)),
};

const read100x1KBCursor: PerformanceTestCase = {
  ...cursorBaseCase,
  name: 'idbRead100x1KBCursor',
  label: 'idb read 100x1KB with cursor',
  prep: () => prep(100, generateString(1)),
};

export const idbReadTestCases = [
  read1MB,
  read1KB,
  read1024x100BGetAll,
  read100x1KBGetAll,
  read1024x100BCursor,
  read100x1KBCursor,
  readJSON,
];
