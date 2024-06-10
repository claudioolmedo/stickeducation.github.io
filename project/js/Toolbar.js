import { UIPanel, UIButton, UICheckbox } from './libs/ui.js';

function Toolbar( editor ) {

	const signals = editor.signals;
	const strings = editor.strings;

	const container = new UIPanel();
	container.setId( 'toolbar' );

	// translate / rotate / scale

	const translateIcon = document.createElement( 'img' );
	translateIcon.title = strings.getKey( 'toolbar/translate' );
	translateIcon.src = 'images/translate.svg';

	const translate = new UIButton();
	translate.dom.className = 'Button selected';
	translate.dom.appendChild( translateIcon );
	translate.onClick( function () {

		signals.transformModeChanged.dispatch( 'translate' );

	} );
	container.add( translate );

	const rotateIcon = document.createElement( 'img' );
	rotateIcon.title = strings.getKey( 'toolbar/rotate' );
	rotateIcon.src = 'images/rotate.svg';

	const rotate = new UIButton();
	rotate.dom.appendChild( rotateIcon );
	rotate.onClick( function () {

		signals.transformModeChanged.dispatch( 'rotate' );

	} );
	container.add( rotate );

	const scaleIcon = document.createElement( 'img' );
	scaleIcon.title = strings.getKey( 'toolbar/scale' );
	scaleIcon.src = 'images/scale.svg';

	const scale = new UIButton();
	scale.dom.appendChild( scaleIcon );
	scale.onClick( function () {

		signals.transformModeChanged.dispatch( 'scale' );

	} );
	//container.add( scale );

	const local = new UICheckbox( false );
	local.dom.title = strings.getKey( 'toolbar/local' );
	local.onChange( function () {

		signals.spaceChanged.dispatch( this.getValue() === true ? 'local' : 'world' );

	} );
	container.add( local );

	// FORK button
	const forkButton = new UIButton();
	forkButton.dom.className = 'Button';
	forkButton.dom.textContent = 'FORK';
	forkButton.onClick( function () {

		const currentUser = window.currentUser;
		const originalOwner = window.originalOwner; // Assume this is set somewhere

		if (currentUser && currentUser.uid !== originalOwner) {
			// Generate a new project ID
			let newProjectId = Math.random().toString(36).substring(2, 10);
			const dateHex = new Date().getTime().toString(16);
			newProjectId += '-' + dateHex;

			// Redirect to the new project ID
			window.location.href = `?id=${newProjectId}`;
		} else {
			console.log('User is the original owner or not logged in.');
		}

	} );

	// Check if the current user is different from the original owner
	const currentUser = window.currentUser;
	const originalOwner = window.originalOwner; // Assume this is set somewhere

	if (currentUser) {
		if (currentUser.uid !== originalOwner) {
			// Show the FORK button
			container.add( forkButton );
		} else {
			console.log('OWNER');
		}
	}

	//

	signals.transformModeChanged.add( function ( mode ) {

		translate.dom.classList.remove( 'selected' );
		rotate.dom.classList.remove( 'selected' );
		scale.dom.classList.remove( 'selected' );

		switch ( mode ) {

			case 'translate': translate.dom.classList.add( 'selected' ); break;
			case 'rotate': rotate.dom.classList.add( 'selected' ); break;
			case 'scale': scale.dom.classList.add( 'selected' ); break;

		}

	} );

	return container;

}

export { Toolbar };
