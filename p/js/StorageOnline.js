import { saveData } from './config/firebase.js';
import { projectId } from './Storage.js'; // Import projectId from Storage.js

export function sendDataToStorageOnline(data) {
    console.log('Data received by StorageOnline:', data);
    const path = `projects/${data.projectId}/state`; // Define the path where you want to save the data
    saveData(path, data)
        .then(() => {
            console.log('Data successfully saved to Firebase.');
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
        });
}

