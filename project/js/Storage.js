import { firebaseAuth, onAuthStateChanged, saveData, getDataFromFirebase } from './config/firebase.js';

function Storage() {
    const indexedDB = window.indexedDB;

    if (indexedDB === undefined) {
        console.warn('Storage: IndexedDB not available.');
        return { init: function () {}, get: function () {}, set: function () {}, clear: function () {} };
    }

    const name = 'threejs-editor';
    const version = 1;
    let database;
    let currentUser = null;

    onAuthStateChanged(firebaseAuth, user => {
        if (user) {
            console.log('User is signed in:', user);
            currentUser = user;
        } else {
            console.log('No user is signed in.');
            currentUser = null;
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    console.log('Received project ID in Storage:', projectId);

    return {
        init: function (callback) {
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
        },
        get: function (callback) {
            const transaction = database.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.get(0);
            request.onsuccess = function (event) {
                console.log('Data retrieved from IndexedDB:', event.target.result);
                if (currentUser) {
                    const userPath = `users/${currentUser.uid}/projects/${projectId}`;
                    getDataFromFirebase(userPath).then(data => {
                        console.log('Data retrieved from Firebase at:', userPath, data);
                    }).catch(error => {
                        console.error('Failed to retrieve data from Firebase:', error);
                    });
                } else {
                    console.log('No current user logged-in, skipping Firebase data retrieval.');
                }
                callback(event.target.result);
            };
        },
        set: function (data) {
            const start = performance.now();
            const transaction = database.transaction(['states'], 'readwrite');
            const objectStore = transaction.objectStore('states');
            const request = objectStore.put(data, 0);
            request.onsuccess = function () {
                console.log('[' + /\d\d\:\d\d\:\d\d/.exec(new Date())[0] + ']', 'Saved state to IndexedDB for project ID ' + projectId + '. ' + (performance.now() - start).toFixed(2) + 'ms');
                if (currentUser) {
                    const userPath = `users/${currentUser.uid}/projects/${projectId}`;
                    const projectPath = `projects/${projectId}`;
                    saveData(userPath, { projectId: projectId }).then(() => {
                        console.log('Reference to project saved to Firebase at:', userPath);
                    }).catch(error => {
                        console.error('Failed to save project reference to Firebase:', error);
                    });
                    saveData(projectPath, { data: data, firebaseId: currentUser.uid }).then(() => {
                        console.log('Data also saved to Firebase at:', projectPath);
                    }).catch(error => {
                        console.error('Failed to save data to Firebase:', error);
                    });
                }
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
        }
    };
}

export { Storage };
