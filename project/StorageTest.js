// Function to open the IndexedDB
function openTestDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('test-database', 1);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('states')) {
                db.createObjectStore('states', { keyPath: 'id', autoIncrement: true });
            }
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

// Function to save data to IndexedDB
function addDataToIndexedDB(db, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.put(data);

        request.onsuccess = () => {
            console.log('Data saved to IndexedDB:', data);
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error saving data to IndexedDB:', event);
            reject(event.target.error);
        };
    });
}

export { openTestDatabase, addDataToIndexedDB };