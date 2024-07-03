import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { firebaseDB } from './config/firebase.js';

export function sendIDToStorageOnlineLoad(projectId) {
    console.log('Project ID received: in StorageOnline LOAD', projectId); // Log the received projectId

    // Define the path to the project data
    const path = `projects/${projectId}/state`;

    // Create a reference to the database path
    const projectRef = ref(firebaseDB, path);

    // Get the data from the database
    get(projectRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                let projectData = snapshot.val();
                console.log('Project data retrieved from Firebase:', JSON.stringify(projectData, null, 2)); // Log the project data

                // Restore empty objects marked with _empty
                projectData = JSON.parse(JSON.stringify(projectData, (key, value) => {
                    if (value && value._empty) {
                        return {};
                    }
                    return value;
                }));

                // Save the data to IndexedDB
                const dbName = `${projectId}FromFirebase`;
                const request = indexedDB.open(dbName, 1);

                request.onupgradeneeded = function(event) {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('states')) {
                        db.createObjectStore('states');
                    }
                };

                request.onsuccess = function(event) {
                    const db = event.target.result;
                    const transaction = db.transaction(['states'], 'readwrite');
                    const objectStore = transaction.objectStore('states');
                    objectStore.put(projectData, 0);

                    transaction.oncomplete = function() {
                        console.log(`Data saved to IndexedDB with name ${dbName}`);
                    };

                    transaction.onerror = function(event) {
                        console.error('Error saving data to IndexedDB:', event.target.error);
                    };
                };

                request.onerror = function(event) {
                    console.error('Error opening IndexedDB:', event.target.error);
                };
            } else {
                console.log('No data available for this project ID.');
            }
        })
        .catch((error) => {
            console.error('Error getting project data:', error);
        });
}
