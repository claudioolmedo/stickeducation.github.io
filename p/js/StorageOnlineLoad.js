import { projectId } from './Storage.js';

// Define the new function to log the projectId
function sendDataToStorageOnlineLoad(id) {
    console.log('Project ID:', id);
}

export { sendDataToStorageOnlineLoad };

