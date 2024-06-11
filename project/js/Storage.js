import { firebaseAuth, firebaseDB, onAuthStateChanged, saveData } from './config/firebase.js';
import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

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
    const name = 'threejs-editor';
    const version = 1;

    // Variable to store the database instance
    let database;

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
        request.onerror = function (event) {
            console.error('Error updating IndexedDB:', event);
        };
    }

    // Initialize the database
    const initDB = function (callback) {
        const request = indexedDB.open(name, version);
        request.onupgradeneeded = function (event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('states')) {
                db.createObjectStore('states');
            }
        };
        request.onsuccess = function (event) {
            database = event.target.result;
            callback();
        };
        request.onerror = function (event) {
            console.error('IndexedDB', event);
        };
    };

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

    // Initialize the database and return the storage object
    initDB(() => {
        console.log('IndexedDB initialized.');
    });

    // Return an object containing methods to interact with IndexedDB
    return {
        init: initDB,
        get: function (callback) {
            const transaction = database.transaction(['states'], 'readonly');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.get(0);
            request.onsuccess = function (event) {
                console.log('Data retrieved from IndexedDB:', event.target.result);
                callback(event.target.result);
            };
            request.onerror = function (event) {
                console.error('Error retrieving data from IndexedDB:', event);
            };
        },
        set: function (data) {
            const start = performance.now();
            const transaction = database.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.put(data, 0);
            request.onsuccess = function () {
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Saved state to IndexedDB for project ID ' + projectId + '. ' + (performance.now() - start).toFixed(2) + 'ms');
                if (window.currentUser) {
                    const userPath = `users/${window.currentUser.uid}/projects/${projectId}`;
                    const projectPath = `projects/${projectId}`;
                    saveData(userPath, { projectId: projectId }).then(() => {
                        console.log('Reference to project saved to Firebase at:', userPath);
                    }).catch(error => {
                        console.error('Failed to save project reference to Firebase:', error);
                    });
                    saveData(projectPath, { data: data, firebaseId: window.currentUser.uid, ownerId: window.currentUser.uid }).then(() => {
                        console.log('Data also saved to Firebase at:', projectPath);
                    }).catch(error => {
                        console.error('Failed to save data to Firebase:', error);
                    });
                }
            };
            request.onerror = function (event) {
                console.error('Error saving data to IndexedDB:', event);
            };
        },
        clear: function () {
            if (database === undefined) return;
            const transaction = database.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.clear();
            request.onsuccess = function () {
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Cleared IndexedDB.');
            };
            request.onerror = function (event) {
                console.error('Error clearing IndexedDB:', event);
            };
        }
    };
}

export { Storage };
