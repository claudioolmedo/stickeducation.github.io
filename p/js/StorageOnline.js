// StorageOnline.js

let database;

const StorageOnline = {
    // Function to set the database instance
    setDatabase: function (db) {
        console.log('Setting database in StorageOnline:', db);
        database = db;
    },

    // Function to save data to Firebase and IndexedDB
    set: function (data) {
        if (!database) {
            console.error('Database is not initialized.');
            return;
        }
        console.log('Starting data save process in StorageOnline with data:', data);
        const start = performance.now();
        const transaction = database.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.put(data, 0);
        request.onsuccess = function () {
            console.log('Data updated in IndexedDB.');

            // Save data to Firebase
            const firebaseData = normalizeForFirebase(data);
            const projectPath = `projects/${projectId}`;
            saveData(projectPath, firebaseData).then(() => {
                console.log('Data saved to Firebase at:', projectPath);
            }).catch(error => {
                console.error('Failed to save data to Firebase:', error);
            });
        };
        request.onerror = function (event) {
            console.error('Error updating IndexedDB:', event);
        };

        // Save data to StorageOnline for Firebase
        pushData(projectPath, firebaseData).then(() => {
            console.log('Data saved to Firebase via StorageOnline at:', projectPath);
        }).catch(error => {
            console.error('Failed to save data to Firebase via StorageOnline:', error);
        });
    }
};

export { StorageOnline };

