import { firebaseDB, onAuthStateChanged } from './config/firebase.js';
import { ref, get, set } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

function normalizeForFirebase(data) {
    const normalizedData = data[0];
    return {
        createdAt: new Date().toISOString(),
        data: normalizedData
    };
}

function saveData(path, data) {
    // Save data to Firebase
    return set(ref(firebaseDB, path), data).then(() => {
        console.log('Data saved to Firebase at path:', path);
    }).catch(error => {
        console.error('Failed to save data to Firebase:', error);
    });
}

function loadFromFirebase(callback) {
    if (!projectId) {
        console.error('Project ID is not defined');
        return callback(null);
    }
    
    get(ref(firebaseDB, `projects/${projectId}`)).then((snapshot) => {
        const firebaseData = snapshot.val();
        if (firebaseData && firebaseData.data) {
            console.log('Data loaded from Firebase:', firebaseData.data);
            callback([firebaseData.data]);
        } else {
            console.log('No data found in Firebase');
            callback(null);
        }
    }).catch(error => {
        console.error('Error loading data from Firebase:', error);
        callback(null);
    });
}

// Function to generate a unique ID
function generateUniqueId() {
    const timestamp = new Date().getTime().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 5);
    return `${timestamp}-${randomStr}`;
}

// Function to normalize data before saving to Firebase
function normalizeForFirebase(data) {
    // Assuming data is an array with one object
    const normalizedData = data[0];
    return {
        createdAt: new Date().toISOString(),
        data: normalizedData
    };
}

// Function to save data to Firebase
function saveData(path, data) {
    return set(ref(firebaseDB, path), data);
}

function Storage(editor) {

    // Retrieve project ID from URL parameters to check if it's being received
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    console.log('Received project ID in Storage:', projectId); // Log the received project ID for debugging

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
                    updateSceneFromFirebase(firebaseData);

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

    // Function to compare and update data between IndexedDB and Firebase
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

            // Normalize data from Firebase and IndexedDB
            const normalizedFirebaseData = normalizeForIndexedDB(firebaseData)[0];
            const normalizedIndexedDBData = normalizeForIndexedDB(indexedDBData)[0];

            if (JSON.stringify(normalizedFirebaseData) === JSON.stringify(normalizedIndexedDBData)) {
                console.log('Data from Firebase and IndexedDB are identical.');
            } else {
                console.log('Data from Firebase and IndexedDB are different.');
                console.log('Firebase Data:', normalizedFirebaseData);
                console.log('IndexedDB Data:', normalizedIndexedDBData);
                // Update IndexedDB with Firebase data if they are different
                updateIndexedDB(normalizedFirebaseData);
            }

            // Save data to a new IndexedDB with the project ID as the database name
            saveToNewIndexedDB(firebaseData, projectId);
        };

        request.onerror = function (event) {
            console.error('Error retrieving data from IndexedDB for comparison:', event);
        };
    }

    function saveToNewIndexedDB(data, projectId) {
        const newDbName = projectId;
        const request = indexedDB.open(newDbName, 1);

        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('states')) {
                db.createObjectStore('states');
            }
        };

        request.onsuccess = function (event) {
            const newDatabase = event.target.result;
            const transaction = newDatabase.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');
            const putRequest = objectStore.put(data, 0);

            putRequest.onsuccess = function () {
                console.log('Data saved to new IndexedDB with project ID:', projectId);
            };

            putRequest.onerror = function (event) {
                console.error('Error saving data to new IndexedDB:', event);
            };
        };

        request.onerror = function (event) {
            console.error('Error opening new IndexedDB:', event);
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

    function updateSceneFromFirebase(firebaseData) {
        const sceneData = firebaseData.data.scene;
        if (sceneData && editor && typeof editor.fromJSON === 'function') {
            editor.fromJSON(sceneData);
            editor.signals.sceneUpdatedFromFirebase.dispatch(firebaseData);
            console.log('Scene updated from Firebase data.');
        } else {
            console.log('No scene data found in Firebase or editor is not properly configured.');
        }
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
                const creationDate = new Date().toISOString();
                const newData = { ...data };
                saveData(newProjectPath, { data: newData, firebaseId: window.currentUser.uid, ownerId: window.currentUser.uid, createdAt: creationDate }).then(() => {
                    console.log('Data saved to new project ID in Firebase:', newProjectPath);

                    // Save the copied data to the new project ID in IndexedDB
                    const newTransaction = database.transaction(['states'], 'readwrite');
                    const newObjectStore = newTransaction.objectStore('states');
                    const newRequest = newObjectStore.put(newData, 0);
                    newRequest.onsuccess = function () {
                        console.log('Data saved to new project ID in IndexedDB.');

                        // Update the original project with the new forkedID
                        const originalProjectPath = `projects/${projectId}`;
                        get(ref(firebaseDB, originalProjectPath)).then((snapshot) => {
                            if (snapshot.exists()) {
                                const originalData = snapshot.val();
                                const updatedOriginalData = {
                                    ...originalData,
                                    forkedIDs: originalData.forkedIDs ? [...originalData.forkedIDs, newProjectId] : [newProjectId]
                                };
                                saveData(originalProjectPath, updatedOriginalData).then(() => {
                                    console.log('Original project updated with new forkedID:', newProjectId);

                                    // Redirect to the new project URL
                                    window.location.href = `./?id=${newProjectId}`;
                                }).catch(error => {
                                    console.error('Failed to update original project with new forkedID:', error);
                                });
                            } else {
                                console.error('Original project data not found.');
                            }
                        }).catch(error => {
                            console.error('Error retrieving original project data:', error);
                        });
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

    // Function to sync data with Firebase
    function syncWithFirebase() {
        get(function(data) {
            if (data) {
                const firebaseData = normalizeForFirebase(data);
                const projectPath = `projects/${projectId}`;
                saveData(projectPath, firebaseData).then(() => {
                    console.log('Data synced with Firebase');
                }).catch(error => {
                    console.error('Failed to sync data with Firebase:', error);
                });
            }
        });
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
		get: function (callback) {
            if (!database) {
                console.error('Database is not initialized.');
                return callback(null);
            }
            const transaction = database.transaction(['states'], 'readonly');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.get(0);
            request.onsuccess = function (event) {
                let data = event.target.result;
                
                if (!data) {
                    console.log('No data found in IndexedDB, trying Firebase');
                    return loadFromFirebase(callback);
                }
                
                // Ensure data is in the correct format
                if (!Array.isArray(data)) {
                    data = [data];
                }
                
                // Check if data has the expected structure
                if (data[0] && data[0].scene) {
                    // Ensure animations property exists
                    if (!data[0].scene.animations) {
                        data[0].scene.animations = [];
                    }
                    callback(data);
                } else {
                    console.error('Data retrieved from IndexedDB is not in the expected format');
                    callback(null);
                }
            };
            request.onerror = function (event) {
                console.error('Error retrieving data from IndexedDB:', event);
                callback(null);
            };
        },
        
        // Store data in the database and Firebase
		set: function (data) {
            if (!database) {
                console.error('Database is not initialized.');
                return;
            }
            const start = performance.now();
            const transaction = database.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');

            // Ensure data is in the correct format for IndexedDB
            const indexedDBData = Array.isArray(data) ? data : [data];

            // Ensure each item in the array has the correct structure
            const formattedData = indexedDBData.map(item => ({
                metadata: item.metadata || {},
                project: item.project || {},
                camera: item.camera || {},
                scene: {
                    metadata: item.scene?.metadata || {},
                    geometries: item.scene?.geometries || [],
                    materials: item.scene?.materials || [],
                    object: item.scene?.object || {},
                    animations: item.scene?.animations || []
                },
                scripts: item.scripts || {},
                history: item.history || { undos: [], redos: [] },
                environment: item.environment || null
            }));

            const request = objectStore.put(formattedData, 0);
            request.onsuccess = function (event) {
                const end = performance.now();
                console.log(`Data saved to IndexedDB. Time taken: ${end - start} ms`);
                console.log(`IndexedDB database name: ${name}`);
                // Save to Firebase if needed
                const firebaseData = normalizeForFirebase(formattedData);
                const projectPath = `projects/${projectId}`;
                saveData(projectPath, firebaseData).then(() => {
                    console.log('Data saved to Firebase at:', projectPath);
                }).catch(error => {
                    console.error('Failed to save data to Firebase:', error);
                });
            };
            request.onerror = function (event) {
                console.error('Error saving data to IndexedDB:', event);
            };
        },
        // Clear all data from the database
		clear: function () {
            if (database) {
                const transaction = database.transaction(['states'], 'readwrite');
                const objectStore = transaction.objectStore('states');
                const request = objectStore.clear();
                request.onsuccess = function (event) {
                    console.log('IndexedDB cleared successfully');
                };
                request.onerror = function (event) {
                    console.error('Error clearing IndexedDB:', event);
                };
            }
        }
	};
}

export { Storage };

function loadFromFirebase(callback) {
    if (!projectId) {
        console.error('Project ID is not defined');
        return callback(null);
    }
    
    get(ref(firebaseDB, `projects/${projectId}`)).then((snapshot) => {
        const firebaseData = snapshot.val();
        if (firebaseData && firebaseData.data) {
            console.log('Data loaded from Firebase:', firebaseData.data);
            Storage.set([firebaseData.data]);
            callback([firebaseData.data]);
        } else {
            console.log('No data found in Firebase');
            callback(null);
        }
    })
        .catch(error => {
            console.error('Error loading data from Firebase:', error);
            callback(null);
        });
}
