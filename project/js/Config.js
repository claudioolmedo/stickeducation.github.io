import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBaATlo1GuJw7s7Vb0jT7Hf7J7l9sbsaOY",
    authDomain: "auth.stick.education",
    databaseURL: "https://editor-1946b-default-rtdb.firebaseio.com",
    projectId: "editor-1946b",
    storageBucket: "editor-1946b.appspot.com",
    messagingSenderId: "462487638341",
    appId: "1:462487638341:web:7e56e691d9c12daa8eee2c",
    measurementId: "G-K15B7WVP0J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getDatabase();

function Config() {

	const name = 'threejs-editor';

	const storage = {
		'language': 'en',

		'autosave': true,

		'project/title': '',
		'project/editable': false,
		'project/vr': false,

		'project/renderer/antialias': true,
		'project/renderer/shadows': true,
		'project/renderer/shadowType': 1, // PCF
		'project/renderer/toneMapping': 0, // NoToneMapping
		'project/renderer/toneMappingExposure': 1,

		'settings/history': false,

		'settings/shortcuts/translate': 'w',
		'settings/shortcuts/rotate': 'e',
		'settings/shortcuts/scale': 'r',
		'settings/shortcuts/undo': 'z',
		'settings/shortcuts/focus': 'f'
	};

	if ( window.localStorage[ name ] === undefined ) {

		window.localStorage[ name ] = JSON.stringify( storage );

	} else {

		const data = JSON.parse( window.localStorage[ name ] );

		for ( const key in data ) {

			storage[ key ] = data[ key ];

		}

	}

	if (window.localStorage[name]) {
		const localData = JSON.parse(window.localStorage[name]);
		for (const key in localData) {
			storage[key] = localData[key];
		}
	}

	auth.onAuthStateChanged(function(user) {
		if (user) {
			const ref = db.ref('configurations/' + user.uid);
			ref.once('value').then(function(snapshot) {
				const firebaseData = snapshot.val();
				if (firebaseData) {
					for (const key in firebaseData) {
						storage[key] = firebaseData[key];
					}
				}
			});
		}
	});

	return {

		getKey: function ( key ) {

			return storage[ key ];

		},

		setKey: function () {
			for (let i = 0, l = arguments.length; i < l; i += 2) {
				storage[arguments[i]] = arguments[i + 1];
			}

			// Salvar no localStorage
			window.localStorage[name] = JSON.stringify(storage);

			// Salvar no Firebase
			const ref = db.ref('configurations/' + auth.currentUser.uid);
			ref.set(storage)
				.then(() => console.log('Saved config to Firebase.'))
				.catch(error => console.error('Error saving config to Firebase:', error));
		},

		clear: function () {

			delete window.localStorage[ name ];

		}

	};

}

export { Config };
