import { saveData } from './config/firebase.js';
export function sendDataToStorageOnline(data, projectId) {
    console.log('Data received by StorageOnline:', data);
    console.log('Project ID received: in StorageOnline', projectId); // Log the received projectId
    const path = `projects/${data.projectId}/state`; // Define the path where you want to save the data
    saveData(path, data)
        .then(() => {
            console.log('Data successfully saved to Firebase.');
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
        });
}

