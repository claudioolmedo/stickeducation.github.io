import { saveData } from './config/firebase.js';

export function sendDataToStorageOnline(data) {
    if (!data.projectId) {
        console.error('Project ID is undefined. Cannot save data to Firebase.');
        return;
    }

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
