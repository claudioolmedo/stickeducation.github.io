import { firebaseAuth, firebaseDB, onAuthStateChanged, saveData } from './config/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

function Storage() {

    // Access the IndexedDB API from the window object
    const indexedDB = window.indexedDB;

    // Check if IndexedDB is available in the browser
    if ( indexedDB === undefined ) {
        console.warn( 'Storage: IndexedDB not available.' );
        return { init: function () {}, get: function () {}, set: function () {}, clear: function () {} };
    }

    // Retrieve project ID from URL parameters to check if it's being received
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    console.log('Received project ID in Storage:', projectId); // Log the received project ID for debugging

    // Define the database name using the project ID and version for IndexedDB
    const name = `threejs-editor`;
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

            // Define the path to retrieve general project data accessible by all users
            const projectPath = `projects/${projectId}`;
            
            // Fetch general project data from Firebase and update IndexedDB
            const projectDataRef = ref(firebaseDB, projectPath);
            get(projectDataRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const firebaseData = snapshot.val();
                    console.log('General project data from Firebase:', firebaseData);
                    compareWithIndexedDB(firebaseData);

                    // Check if the current user is the owner
                    if (firebaseData.ownerId) {
                        if (firebaseData.ownerId === window.currentUser.uid) {
                            console.log('OWNER');
                            window.isReadOnly = false; // User can edit
                            document.getElementById('fork-button').style.display = 'none'; // Hide the fork button
                        } else {
                            console.log('NO OWNER');
                            
                            window.isReadOnly = true; // User cannot edit
                            console.log('window.isReadOnly w/ NO OWNER:', window.isReadOnly);

                            // Show the fork button
                            document.getElementById('fork-button').style.display = 'block';
                        }
                    } else {
                        window.isReadOnly = true; // Default to read-only if no ownerId
                    }

                    // Display forkFrom if it exists
                    if (firebaseData.forkFrom) {
                        console.log('This project was forked from:', firebaseData.forkFrom);
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

    function compareWithIndexedDB(firebaseData) {
        if (!database) {
            console.error('Database is not initialized.');
            return;
        }
        const transaction = database.transaction(['states'], 'readonly');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.get(0);

        request.onsuccess = function (event) {
            const indexedDBData = event.target.result;
            console.log('Data from IndexedDB:', indexedDBData);

            // Extract the relevant part of the Firebase data
            const firebaseRelevantData = firebaseData.data;

            if (JSON.stringify(firebaseRelevantData) === JSON.stringify(indexedDBData)) {
                console.log('Data from Firebase and IndexedDB are identical.');
            } else {
                console.log('Data from Firebase and IndexedDB are different.');
                console.log('Firebase Data:', firebaseRelevantData);
                console.log('IndexedDB Data:', indexedDBData);
                // Update IndexedDB with Firebase data if they are different
                updateIndexedDB(firebaseRelevantData);
            }
        };

        request.onerror = function (event) {
            console.error('Error retrieving data from IndexedDB for comparison:', event);
        };
    }

    function updateIndexedDB(data) {
        if (!database) {
            console.error('Database is not initialized.');
            return;
        }
        const transaction = database.transaction(['states'], 'readwrite');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.put(data, 0);
        request.onsuccess = function () {
            console.log('Data updated in IndexedDB.');
            console.log('Data updated in IndexedDB:', data); // Log the data updated in IndexedDB
        };
        request.onerror = function (event) {
            console.error('Error updating IndexedDB:', event);
        };
    }

    // Function to generate a new project ID
    function generateNewProjectId() {
        let newProjectId = Math.random().toString(36).substring(2, 10); // Generate a random alphanumeric string
        const dateHex = new Date().getTime().toString(16); // Get current date and time in hexadecimal
        newProjectId += '-' + dateHex; // Append the hexadecimal date to the project ID
        return newProjectId;
    }

    // Function to copy project data to a new project ID
    function forkProject() {
        const newProjectId = generateNewProjectId();
        console.log('Forking project to new ID:', newProjectId);

        // Retrieve current project data from IndexedDB
        const transaction = database.transaction(['states'], 'readonly');
        const objectStore = transaction.objectStore('states');
        const request = objectStore.get(0);

        request.onsuccess = function (event) {
            const data = event.target.result;
            if (data) {
                // Save the copied data to the new project ID in Firebase
                const newProjectPath = `projects/${newProjectId}`;
                const creationDate = new Date().toISOString(); // Get the current date and time in ISO format
                // Include the forkFrom field in the data being saved
                const newData = { ...data, forkFrom: projectId };
                saveData(newProjectPath, { data: newData, firebaseId: window.currentUser.uid, ownerId: window.currentUser.uid, forkFrom: projectId, createdAt: creationDate }).then(() => {
                    console.log('Data saved to new project ID in Firebase:', newProjectPath);

                    // Save the copied data to the new project ID in IndexedDB
                    const newTransaction = database.transaction(['states'], 'readwrite');
                    const newObjectStore = newTransaction.objectStore('states');
                    const newRequest = newObjectStore.put(newData, 0);
                    newRequest.onsuccess = function () {
                        console.log('Data saved to new project ID in IndexedDB.');

                        // Redirect to the new project URL
                        window.location.href = `./?id=${newProjectId}`;
                    };
                }).catch(error => {
                    console.error('Failed to save data to new project ID in Firebase:', error);
                });
            } else {
                console.log('No data found to fork.');
            }
        };

        request.onerror = function (event) {
            console.error('Error retrieving data for forking:', event);
        };
    }

    // Add event listener to the fork button
    document.getElementById('fork-button').addEventListener('click', forkProject);

    function cleanData(data) {
        if (Array.isArray(data)) {
            return data.map(cleanData);
        } else if (data !== null && typeof data === 'object') {
            return Object.keys(data).reduce((acc, key) => {
                if (data[key] !== undefined) {
                    acc[key] = cleanData(data[key]);
                }
                return acc;
            }, {});
        }
        return data;
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
            if (!database) {
                console.error('Database is not initialized.');
                return;
            }
            // Start a transaction to read data
			const transaction = database.transaction( [ 'states' ], 'readonly' );
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
        
        // Store data in the database and Firebase
		set: function ( data ) {
            if (!database) {
                console.error('Database is not initialized.');
                return;
            }
            const cleanedData = cleanData(data); // Clean the data before saving
            const start = performance.now();
            const transaction = database.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.put(cleanedData, 0);
            request.onsuccess = function () {
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Saved state to IndexedDB for project ID ' + projectId + '. ' + (performance.now() - start).toFixed(2) + 'ms');
                // Check if the project already exists and has an owner before saving data to Firebase
                const projectPath = `projects/${projectId}`;
                const projectDataRef = ref(firebaseDB, projectPath);
                get(projectDataRef).then((snapshot) => {
                    if (snapshot.exists()) {
                        const firebaseData = snapshot.val();
                        if (firebaseData.ownerId && firebaseData.ownerId !== window.currentUser.uid) {
                            console.log('Project already exists and has an owner. Data cannot be modified directly.');
                        } else {
                            console.log('Project does not exist or does not have an owner. Allowing data modification.');
                            const creationDate = new Date().toISOString(); // Get the current date and time in ISO format
                            const ownerId = firebaseData.ownerId ? firebaseData.ownerId : window.currentUser.uid;
                            const updatedData = { ...cleanedData, forkFrom: firebaseData.forkFrom }; // Preserve forkFrom field
                            saveData(projectPath, { data: updatedData, firebaseId: window.currentUser.uid, ownerId: ownerId, createdAt: creationDate }).then(() => {
                                console.log('Data saved to Firebase at:', projectPath);
                            }).catch(error => {
                                console.error('Failed to save data to Firebase:', error);
                            });
                        }
                    } else {
                        console.log('Project does not exist. Allowing data modification.');
                        const creationDate = new Date().toISOString(); // Get the current date and time in ISO format
                        saveData(projectPath, { data: cleanedData, firebaseId: window.currentUser.uid, ownerId: window.currentUser.uid, createdAt: creationDate }).then(() => {
                            console.log('Data saved to Firebase at:', projectPath);
                        }).catch(error => {
                            console.error('Failed to save data to Firebase:', error);
                        });
                    }
                }).catch((error) => {
                    console.error('Error checking project existence and owner:', error);
                });
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
