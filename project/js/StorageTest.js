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
export async function addDataToIndexedDB(db, keyValuePairs) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');

        keyValuePairs.forEach((pair) => {
            const request = objectStore.put({ id: pair.key, value: pair.value }); // Ensure the key is provided

            request.onsuccess = () => {
                console.log('Data added successfully:', pair);
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

export { openTestDatabase, addDataToIndexedDB };