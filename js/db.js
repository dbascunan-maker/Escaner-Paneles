const DB_NAME = 'SolarScannerDB';
const DB_VERSION = 1;
const STORE_NAME = 'captures';

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            store.createIndex('date', 'date', { unique: false });
        }
    };

    request.onsuccess = (event) => {
        resolve(event.target.result);
    };

    request.onerror = (event) => {
        reject('Error opening IndexedDB: ' + event.target.error);
    };
});

async function saveCapture(captureData) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(captureData);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject('Error saving capture: ' + request.error);
    });
}

async function getHistory() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by date descending (assuming date is a string ISO or comparable)
            // or just reverse the result if they are added sequentially
            resolve(request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        };
        request.onerror = () => reject('Error fetching history: ' + request.error);
    });
}

async function deleteItem(id) {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error deleting item: ' + request.error);
    });
}

async function clearHistory() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject('Error clearing history: ' + request.error);
    });
}

async function getDbStats() {
    const db = await dbPromise;
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => resolve({ count: request.result });
        request.onerror = () => reject('Error getting stats: ' + request.error);
    });
}
