import { firebaseAuth, firebaseDB, onAuthStateChanged, saveData } from './config/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import signals from 'path/to/signals.min.js'; // Import the signals library

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

    // Check the authentication state when initializing storage
    onAuthStateChanged(firebaseAuth, user => {
        if (user) {
            console.log('User is signed in:', user);
            window.currentUser = user; // Store the current user
            console.log('Current user window.currentUser:', window.currentUser);
            console.log('Project ID:', projectId);

            // Define the path to retrieve project data from the current user's directory
            const userPath = `users/${window.currentUser.uid}/projects/${projectId}`;
            // Define the path to retrieve general project data accessible by all users
            const projectPath = `projects/${projectId}`;
            
            // Fetch project data from Firebase and update IndexedDB
            const userDataRef = ref(firebaseDB, userPath);
            get(userDataRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log('User project data:', data);
                    updateIndexedDB(data);
                } else {
                    console.log('No user project data found.');
                }
            }).catch((error) => {
                console.error('Error fetching user project data:', error);
            });

            // Fetch general project data from Firebase and update IndexedDB
            const projectDataRef = ref(firebaseDB, projectPath);
            get(projectDataRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    console.log('General project data:', data);
                    updateIndexedDB(data);

                    // Check if the current user is the owner
                    if (data.ownerId) {
                        if (data.ownerId === window.currentUser.uid) {
                            console.log('OWNER');
                            window.isReadOnly = false; // User can edit
                        } else {
                            console.log('NO OWNER');
                            window.isReadOnly = true; // User cannot edit
                            editor.signals.showForkButton.dispatch(); // Dispatch signal to show FORK button
                        }
                    } else {
                        window.isReadOnly = true; // Default to read-only if no ownerId
                    }
                } else {
                    console.log('No general project data found.');
                    window.isReadOnly = true; // Default to read-only if no data found
                }
            }).catch((error) => {
                console.error('Error fetching general project data:', error);
                window.isReadOnly = true; // Default to read-only on error
            });

        } else {
            console.log('No user is signed in.');
            window.currentUser = null; // Clear the current user
            window.isReadOnly = true; // Default to read-only if no user is signed in
        }
    });


    // Retrieve project ID from URL parameters to check if it's being received
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    console.log('Received project ID in Storage:', projectId); // Log the received project ID for debugging

    function updateIndexedDB(data) {
        const transaction = database.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.put(data, 0);
        request.onsuccess = function () {
            console.log('Data updated in IndexedDB.');
        };
    }

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
                // Log the successful data retrieval
                console.log('Data retrieved from IndexedDB:', event.target.result);

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
                if (window.currentUser) {
                    // Define the path to store project data under the current user's directory
                    const userPath = `users/${window.currentUser.uid}/projects/${projectId}`;
                    // Define the path to store general project data accessible by all users
                    const projectPath = `projects/${projectId}`;
                    // Save to user's path
                    saveData(userPath, { projectId: projectId }).then(() => {
                        console.log('Reference to project saved to Firebase at:', userPath);
                    }).catch(error => {
                        console.error('Failed to save project reference to Firebase:', error);
                    });

                    // Check if the project already has an owner
                    const projectDataRef = ref(firebaseDB, projectPath);
                    get(projectDataRef).then((snapshot) => {
                        if (snapshot.exists()) {
                            const existingData = snapshot.val();
                            if (!existingData.ownerId) {
                                // If no ownerId, save the data with the current user as the owner
                                saveData(projectPath, { data: data, firebaseId: window.currentUser.uid, ownerId: window.currentUser.uid }).then(() => {
                                    console.log('Data also saved to Firebase at:', projectPath);
                                }).catch(error => {
                                    console.error('Failed to save data to Firebase:', error);
                                });
                            } else {
                                console.log('Project already has an owner:', existingData.ownerId);
                            }
                        } else {
                            // If no data exists, save the data with the current user as the owner
                            saveData(projectPath, { data: data, firebaseId: window.currentUser.uid, ownerId: window.currentUser.uid }).then(() => {
                                console.log('Data also saved to Firebase at:', projectPath);
                            }).catch(error => {
                                console.error('Failed to save data to Firebase:', error);
                            });
                        }
                    }).catch(error => {
                        console.error('Error fetching project data:', error);
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

export { Storage };
