import { ref, get } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { firebaseDB } from './config/firebase.js';

export function sendIDToStorageOnlineLoad(projectId) {
    console.log('Project ID received: in StorageOnline LOAD', projectId); // Log the received projectId

    // Define the path to the project data
    const path = `projects/${projectId}/state`;

    // Create a reference to the database path
    const projectRef = ref(firebaseDB, path);

    // Get the data from the database
    get(projectRef)
        .then((snapshot) => {
            if (snapshot.exists()) {
                console.log('Project data:', snapshot.val()); // Log the project data
            } else {
                console.log('No data available for this project ID.');
            }
        })
        .catch((error) => {
            console.error('Error getting project data:', error);
        });
}
