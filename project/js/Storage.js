import { firebaseAuth, onAuthStateChanged, saveData } from './config/firebase.js'; // Ensure the path is correct

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
	const name = 'threejs-editor';
	const version = 1;

    // Variable to store the database instance
	let database;
    let currentUser = null;

    // Check the authentication state when initializing storage
    onAuthStateChanged(firebaseAuth, user => {
        if (user) {
            console.log('User is signed in:', user);
            currentUser = user; // Store the current user
        } else {
            console.log('No user is signed in.');
            currentUser = null; // Clear the current user
        }
    });

    // Retrieve project ID from URL parameters to check if it's being received
    const urlParams = new URLSearchParams(window.location.search);
    let projectId = urlParams.get('id');

    if (!projectId) {
        projectId = generateUniqueId();
        checkAndCreateProjectInFirebase(projectId, () => {
            const newUrl = `${window.location.pathname}?id=${projectId}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            window.location.reload();
        });
    }

    console.log('Received project ID in Storage:', projectId); // Log the received project ID for debugging

    // Return an object containing methods to interact with IndexedDB
    return {
        // Initialize the database
		init: function ( callback ) {
            // Open a connection to the IndexedDB
			const request = indexedDB.open( name, version );
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
                // Call the callback function if provided
				callback();
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
        
        // Store data in the database firebase
		set: function ( data ) {
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
                console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved state to IndexedDB for project ID ' + projectId + '. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
                // Check if there is a logged-in user before saving to Firebase
                if (currentUser) {
                    // Define the path to store project data under the current user's directory
                    const userPath = `users/${currentUser.uid}/projects/${projectId}`;
                    // Define the path to store general project data accessible by all users
                    const projectPath = `projects/${projectId}`;
                    // Save to user's path
                    saveData(userPath, { projectId: projectId }).then(() => {
                        console.log('Reference to project saved to Firebase at:', userPath);
                    }).catch(error => {
                        console.error('Failed to save project reference to Firebase:', error);
                    });
                    // Save to project's path
                    saveData(projectPath, { data: data, firebaseId: currentUser.uid }).then(() => {
                        console.log('Data also saved to Firebase at:', projectPath);
                    }).catch(error => {
                        console.error('Failed to save data to Firebase:', error);
                    });
                }
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
		}
	};
}

function generateUniqueId() {
    return 'id' + Math.random().toString(36).substr(2, 9);
}

function checkAndCreateProjectInFirebase(projectId, callback) {
    const projectPath = `projects/${projectId}`;
    firebase.database().ref(projectPath).once('value', snapshot => {
        if (snapshot.exists()) {
            console.log('Project already exists in Firebase:', projectId);
            callback();
        } else {
            firebase.database().ref(projectPath).set({ createdAt: new Date().toISOString() }, error => {
                if (error) {
                    console.error('Error creating project in Firebase:', error);
                } else {
                    console.log('Project created in Firebase:', projectId);
                    callback();
                }
            });
        }
    });
}

export { Storage };
