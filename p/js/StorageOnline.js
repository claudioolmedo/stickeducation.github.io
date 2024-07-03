import { saveData } from './config/firebase.js';
export function sendDataToStorageOnline(data, projectId) {
    console.log('Data received by StorageOnline:', data);
    console.log('Project ID received: in StorageOnline', projectId); // Log the received projectId

    // Replace null or undefined values with an empty string
    const sanitizedData = JSON.parse(JSON.stringify(data, (key, value) => value ?? ''));

    // Log the data before saving to Firebase
    console.log('Data to be saved to Firebase:', JSON.stringify(sanitizedData, null, 2));

    const path = `projects/${projectId}/state`; // Define the path where you want to save the data
    saveData(path, sanitizedData)
        .then(() => {
            console.log('Data successfully saved to Firebase from StorageOnline.');
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
        });
}
