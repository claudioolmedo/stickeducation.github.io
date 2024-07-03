import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { firebaseDB } from './config/firebase.js';

export function sendIDToStorageOnlineLoad(projectId) {
    console.log('Project ID received: in StorageOnline LOAD', projectId);

    const path = `projects/${projectId}/state`;
    const projectRef = ref(firebaseDB, path);

    get(projectRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                let projectData = snapshot.val();
                console.log('Project data retrieved from Firebase:', JSON.stringify(projectData, null, 2));

                // Function to restore empty objects
                function restoreData(obj) {
                    if (obj === null || typeof obj !== 'object') {
                        return obj;
                    }

                    if (Array.isArray(obj)) {
                        return obj.map(restoreData);
                    }

                    const newObj = {};
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key)) {
                            if (obj[key] && obj[key]._empty === true) {
                                newObj[key] = {};
                            } else {
                                newObj[key] = restoreData(obj[key]);
                            }
                        }
                    }
                    return newObj;
                }

                projectData = restoreData(projectData);

                // Save the restored data to IndexedDB
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
