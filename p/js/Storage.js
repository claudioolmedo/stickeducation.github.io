import { StorageOnline } from './StorageOnline.js';

function Storage() {

    // Access the IndexedDB API from the window object
    const indexedDB = window.indexedDB;

    // Check if IndexedDB is available in the browser
    if (indexedDB === undefined) {
        // Log a warning if IndexedDB is not available
        console.warn('Storage: IndexedDB not available.');
        // Return a dummy object with empty methods to avoid errors when calling these methods
        return { init: function () {}, get: function () {}, set: function () {}, clear: function () {} };
    }

    // Define the database name and version for IndexedDB
    const name = projectId; // Use the received ID as the database name
    const version = 1;

    // Variable to store the database instance
    let database;

    // Return an object containing methods to interact with IndexedDB
    return {
        // Initialize the database
        init: function (callback) {
            console.log('Initializing IndexedDB with projectId:', projectId);
            // Open a connection to the IndexedDB
            const request = indexedDB.open(projectId, version);
            // Setup the database if it's the first time opening this version
            request.onupgradeneeded = function (event) {
                console.log('Upgrading IndexedDB...');
                // Get the database from the event
                const db = event.target.result;
                // Create an object store named 'states' if it doesn't already exist
                if (db.objectStoreNames.contains('states') === false) {
                    db.createObjectStore('states');
                }
            };
            // Handle successful database opening
            request.onsuccess = function (event) {
                // Store the database instance
                database = event.target.result;
                console.log('IndexedDB initialized successfully:', database);
                // Pass the database instance to StorageOnline
                StorageOnline.setDatabase(database);
                // Call the callback function if provided
                if (callback) callback();
            };
            // Log errors during the database opening
            request.onerror = function (event) {
                console.error('Error opening IndexedDB:', event);
            };
        },
        // Retrieve data from the database
        get: function (callback) {
            console.log('Retrieving data from IndexedDB...');
            // Start a transaction to read data
            const transaction = database.transaction(['states'], 'readwrite');
            // Access the 'states' object store
            const objectStore = transaction.objectStore('states');
            // Get the data at index 0
            const request = objectStore.get(0);
            // Handle successful data retrieval
            request.onsuccess = function (event) {
                console.log('Data retrieved from IndexedDB:', event.target.result);
                // Call the callback function with the result
                callback(event.target.result);
            };
        },
        // Store data in the database and Firebase via StorageOnline
        set: function (data) {
            console.log('Storing data in IndexedDB and Firebase via StorageOnline:', data);
            // Call the set function in StorageOnline to save data to Firebase and IndexedDB
            StorageOnline.set(data);
        },
        // Clear all data from the database
        clear: function () {
            console.log('Clearing all data from IndexedDB...');
            // Check if the database instance is available
            if (database === undefined) return;
            // Start a transaction to clear data
            const transaction = database.transaction(['states'], 'readwrite');
            // Access the 'states' object store
            const objectStore = transaction.objectStore('states');
            // Clear all data in the object store
            const request = objectStore.clear();
            // Handle successful clearing of the store
            request.onsuccess = function () {
                // Log the successful clearing
                console.log('Cleared IndexedDB successfully.');
            };
        }
    };
}

export { Storage };
