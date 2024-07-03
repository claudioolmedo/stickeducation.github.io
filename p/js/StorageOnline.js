import { saveData } from './config/firebase.js';
export function sendDataToStorageOnline(data, projectId) {
    console.log('Data received by StorageOnline:', data);
    console.log('Project ID received: in StorageOnline', projectId); // Log the received projectId

    // Replace null, undefined, or empty objects with a default value
    const sanitizedData = JSON.parse(JSON.stringify(data, (key, value) => {
        if (value === null || value === undefined) {
            return '';
        }
        if (typeof value === 'object' && Object.keys(value).length === 0) {
            return { _empty: true }; // Mark empty objects with a special key
        }
        return value;
    }));

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

