import { saveData, getData } from './config/firebase.js'; // Import getData from firebase.js

export function sendIDToStorageOnlineLoad(projectId) {
    console.log('Project ID received: in StorageOnline LOAD', projectId); // Log the received projectId

    // Retrieve data from Firebase
    getData(projectId).then(data => {
        console.log('Data retrieved from Firebase:', data); // Log the retrieved data

        // Open IndexedDB
        const request = indexedDB.open('testX', 1);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('projects')) {
                db.createObjectStore('projects', { keyPath: 'id' });
            }
        };

        request.onsuccess = event => {
            const db = event.target.result;
            const transaction = db.transaction(['projects'], 'readwrite');
            const store = transaction.objectStore('projects');
            store.put({ id: projectId, data: data });

            transaction.oncomplete = () => {
                console.log('Data saved to IndexedDB');
            };

            transaction.onerror = () => {
                console.error('Error saving data to IndexedDB');
            };
        };

        request.onerror = () => {
            console.error('Error opening IndexedDB');
        };
    }).catch(error => {
        console.error('Error retrieving data from Firebase:', error);
    });
}