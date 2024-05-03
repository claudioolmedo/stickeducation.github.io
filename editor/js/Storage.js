function Storage() {

    // Access the IndexedDB API from the window object
	const indexedDB = window.indexedDB;

    // Check if IndexedDB is available in the browser
	if ( indexedDB === undefined ) {
        // Log a warning if IndexedDB is not available
		console.warn( 'Storage: IndexedDB not available.' );
        // Return a dummy object with empty methods to avoid errors when calling these methods
		return { init: function () {}, get: function () {}, set: function () {}, clear: function () {} };
	}

    // Define the database name and version for IndexedDB
	const name = 'threejs-editor';
	const version = 1;

    // Variable to store the database instance
	let database;

    // Return an object containing methods to interact with IndexedDB
	return {
        // Initialize the database
		init: function ( callback ) {
            // Open a connection to the IndexedDB
			const request = indexedDB.open( name, version );
            // Setup the database if it's the first time opening this version
			request.onupgradeneeded = function ( event ) {
                // Get the database from the event
				const db = event.target.result;
                // Create an object store named 'states' if it doesn't already exist
				if ( db.objectStoreNames.contains( 'states' ) === false ) {
					db.createObjectStore( 'states' );
				}
			};
            // Handle successful database opening
			request.onsuccess = function ( event ) {
                // Store the database instance
				database = event.target.result;
                // Call the callback function if provided
				callback();
			};
            // Log errors during the database opening
			request.onerror = function ( event ) {
				console.error( 'IndexedDB', event );
			};
		},
        // Retrieve data from the database
		get: function ( callback ) {
            // Start a transaction to read data
			const transaction = database.transaction( [ 'states' ], 'readwrite' );
            // Access the 'states' object store
			const objectStore = transaction.objectStore( 'states' );
            // Get the data at index 0
			const request = objectStore.get( 0 );
            // Handle successful data retrieval
			request.onsuccess = function ( event ) {
                // Call the callback function with the result
				callback( event.target.result );
			};
		},
        // Store data in the database
		set: function ( data ) {
            // Record the start time for performance measurement
			const start = performance.now();
            // Start a transaction to write data
			const transaction = database.transaction( [ 'states' ], 'readwrite' );
            // Access the 'states' object store
			const objectStore = transaction.objectStore( 'states' );
            // Put the data at index 0
			const request = objectStore.put( data, 0 );
            // Handle successful data storage
			request.onsuccess = function () {
                // Log the successful storage and the time taken
				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
			};
		},
        // Clear all data from the database
		clear: function () {
            // Check if the database instance is available
			if ( database === undefined ) return;
            // Start a transaction to clear data
			const transaction = database.transaction( [ 'states' ], 'readwrite' );
            // Access the 'states' object store
			const objectStore = transaction.objectStore( 'states' );
            // Clear all data in the object store
			const request = objectStore.clear();
            // Handle successful clearing of the store
			request.onsuccess = function () {
                // Log the successful clearing
				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Cleared IndexedDB.' );
			};
		}
	};
}

export { Storage };
