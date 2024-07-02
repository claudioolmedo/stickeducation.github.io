import { saveData } from './config/firebase.js';
export function sendDataToStorageOnline(data, projectId) {
    console.log('Data received by StorageOnline:', data);
    console.log('Project ID received: in StorageOnline', projectId); // Log the received projectId

    // Transform the data to match the Firebase format
    const transformedData = {
        state: {
            project: data[0].project,
            camera: data[0].camera,
            scene: data[0].scene
        }
    };

    const path = `projects/${projectId}/state`; // Define the path where you want to save the data
    saveData(path, transformedData)
        .then(() => {
            console.log('Data successfully saved to Firebase.');
        })
        .catch((error) => {
            console.error('Error saving data to Firebase:', error);
        });
}
