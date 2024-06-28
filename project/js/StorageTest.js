// Add this constant at the top of the file
const DB_NAME = 'threejs-editor';

// Add this new function to get the database name
export function getDatabaseName() {
    return DB_NAME;
}

// Update the openTestDatabase function to use the DB_NAME constant
export function openTestDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2); // Incrementamos a versão para forçar uma atualização

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (db.objectStoreNames.contains('states')) {
                db.deleteObjectStore('states');
            }
            db.createObjectStore('states', { keyPath: 'id', autoIncrement: true });
        };

        request.onsuccess = (event) => {
            console.log('IndexedDB opened successfully');
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            console.error('Error opening IndexedDB:', event);
            reject(event.target.error);
        };
    });
}

// Function to add data to IndexedDB
export function addDataToIndexedDB(db, keyValuePairs) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');

        keyValuePairs.forEach((pair) => {
            const request = objectStore.add({ key: pair.key, value: pair.value });
            request.onsuccess = () => {
                console.log('Data added to IndexedDB:', pair);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

export function clearIndexedDB(db) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}