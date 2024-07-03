import { saveData } from './config/firebase.js';

export function sendDataToStorageOnline(data, projectId) {
    console.log('Data received by StorageOnline:', data);
    console.log('Project ID received: in StorageOnline', projectId);

    // Function to deep clone and sanitize the data
    function sanitizeData(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitizeData);
        }

        const newObj = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (typeof value === 'object' && Object.keys(value).length === 0) {
                    newObj[key] = { _empty: true };
                } else {
                    newObj[key] = sanitizeData(value);
                }
            }
        }
        return newObj;
    }

    const sanitizedData = sanitizeData(data);

    console.log('Data to be saved to Firebase:', JSON.stringify(sanitizedData, null, 2));

    const path = `projects/${projectId}/state`;
    saveData(path, sanitizedData)
        .then(() => {
            console.log('Data successfully saved to Firebase from StorageOnline.');
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
        });
}
