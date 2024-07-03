import { sendDataToStorageOnline } from './StorageOnline.js';
import { sendIDToStorageOnlineLoad } from './StorageOnlineLoad.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { firebaseDB } from './config/firebase.js';

function Storage() {

    // Access the IndexedDB API from the window object
	const indexedDB = window.indexedDB;

    // Check if IndexedDB is available in the browser
	if ( indexedDB === undefined ) {
        // Log a warning if IndexedDB is not available
		console.warn( 'Storage: IndexedDB not available.' );
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
		init: function ( callback ) {
            // Open a connection to the IndexedDB
			const request = indexedDB.open( projectId, version );
            // Setup the database if it's the first time opening this version
			request.onupgradeneeded = function ( event ) {
                // Get the database from the event
				const db = event.target.result;
                // Create an object store named 'states' if it doesn't already exist
				if ( db.objectStoreNames.contains( 'states' ) === false ) {
					db.createObjectStore( 'states' );
				}
			};
            // Handle successful database opening
			request.onsuccess = function ( event ) {
                // Store the database instance
				database = event.target.result;
                // Load data from Firebase after initializing local database
                this.loadFromFirebase(projectId, callback);
			};
            // Log errors during the database opening
			request.onerror = function ( event ) {
				console.error( 'IndexedDB', event );
			};
		},
        // Retrieve data from the database
		get: function ( callback ) {
            // Start a transaction to read data
			const transaction = database.transaction( [ 'states' ], 'readwrite' );
            // Access the 'states' object store
			const objectStore = transaction.objectStore( 'states' );
            // Get the data at index 0
			const request = objectStore.get( 0 );
            // Handle successful data retrieval
			request.onsuccess = function ( event ) {
                // Call the callback function with the result
				callback( event.target.result );
			};
		},
        // Store data in the database
		set: function ( data, projectId ) {
            // Record the start time for performance measurement
			const start = performance.now();
            // Start a transaction to write data
			const transaction = database.transaction( [ 'states' ], 'readwrite' );
            // Access the 'states' object store
			const objectStore = transaction.objectStore( 'states' );
            // Put the data at index 0
			const request = objectStore.put( data, 0 );
            // Handle successful data storage
			request.onsuccess = function () {
                // Log the successful storage and the time taken
				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
                // Send data to StorageOnline with projectId
				sendDataToStorageOnline( data, projectId );
				sendIDToStorageOnlineLoad( projectId );
			};
		},
        // Clear all data from the database
		clear: function () {
            // Check if the database instance is available
			if ( database === undefined ) return;
            // Start a transaction to clear data
			const transaction = database.transaction( [ 'states' ], 'readwrite' );
            // Access the 'states' object store
			const objectStore = transaction.objectStore( 'states' );
            // Clear all data in the object store
			const request = objectStore.clear();
            // Handle successful clearing of the store
			request.onsuccess = function () {
                // Log the successful clearing
				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Cleared IndexedDB.' );
			};
		},
        loadFromFirebase: function (projectId, callback) {
            const path = `projects/${projectId}/state`;
            const projectRef = ref(firebaseDB, path);

            get(projectRef)
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        let projectData = snapshot.val();
                        console.log('Project data retrieved from Firebase:', JSON.stringify(projectData, null, 2));

                        projectData = this.restoreData(projectData);

                        // Save Firebase data to local IndexedDB
                        const transaction = database.transaction(['states'], 'readwrite');
                        const objectStore = transaction.objectStore('states');
                        const request = objectStore.put(projectData, 0);

                        request.onsuccess = function () {
                            console.log('Data from Firebase saved to local IndexedDB');
                            if (callback) callback();
                        };

                        request.onerror = function (error) {
                            console.error('Error saving Firebase data to local IndexedDB:', error);
                            if (callback) callback();
                        };
                    } else {
                        console.log('No data available in Firebase for this project ID.');
                        if (callback) callback();
                    }
                })
                .catch((error) => {
                    console.error('Error getting project data from Firebase:', error);
                    if (callback) callback();
                });
        },

        restoreData: function (obj) {
            if (obj === null || typeof obj !== 'object') {
                return obj;
            }

            if (Array.isArray(obj)) {
                return obj.map(this.restoreData.bind(this));
            }

            const newObj = {};
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    if (obj[key] && obj[key]._empty === true) {
                        newObj[key] = {};
                    } else {
                        newObj[key] = this.restoreData(obj[key]);
                    }
                }
            }
            return newObj;
        }
	};
}

export { Storage };
