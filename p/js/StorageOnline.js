import { saveData } from './config/firebase.js';

export function sendDataToStorageOnline(data) {
    console.log('Data received by StorageOnline:', data);
    
    // Use the global projectId
    const projectId = window.projectId;
    
    if (!projectId) {
        console.error('Project ID is not defined.');
        return;
    }

    const path = `projects/${projectId}/state`; // Define the path where you want to save the data
    saveData(path, data)
        .then(() => {
            console.log('Data successfully saved to Firebase.');
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
        });
}
