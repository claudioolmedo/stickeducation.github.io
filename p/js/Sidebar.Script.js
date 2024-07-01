import { UIPanel, UIBreak, UIText, UIButton, UIRow, UIInput } from './libs/ui.js';

import { AddScriptCommand } from './commands/AddScriptCommand.js';
import { SetScriptValueCommand } from './commands/SetScriptValueCommand.js';
import { RemoveScriptCommand } from './commands/RemoveScriptCommand.js';

const isElectron = () => {
    // Verifica se está rodando em Electron (renderer process)
    if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` is set to true
    if (typeof navigator === 'object' && navigator.userAgent && navigator.userAgent.includes('Electron')) {
        return true;
    }

    return false;
};

let fs, os, exec, path, __dirname;

if (isElectron()) {
    fs = window.nodeAPI.fs;
    os = window.nodeAPI.os;
    exec = window.nodeAPI.exec;
    path = window.nodeAPI.path;
    __dirname = window.nodeAPI.__dirname;
} else {
    console.log("Running in a standard web browser.");
}

function SidebarScript( editor ) {

	const strings = editor.strings;

	const signals = editor.signals;

	const container = new UIPanel();
	container.setDisplay( 'none' );

	container.add( new UIText( strings.getKey( 'sidebar/script' ) ).setTextTransform( 'uppercase' ) );
	container.add( new UIBreak() );
	container.add( new UIBreak() );

	//

	const scriptsContainer = new UIRow();
	container.add( scriptsContainer );

	const newScript = new UIButton( strings.getKey( 'sidebar/script/new' ) );
	newScript.onClick( function () {

		const script = { 
			name: '', 
			source: `#define LED_PIN 5 // Use the GPIO number. Adjust if necessary.
		
		void setup() {
		  pinMode(LED_PIN, OUTPUT); // Initialize LED_PIN as an output.
		}
		
		void loop() {
		  digitalWrite(LED_PIN, HIGH); // Turn the LED on
		  delay(1000);                 // Wait for a second
		  digitalWrite(LED_PIN, LOW);  // Turn the LED off
		  delay(1000);                 // Wait for a second
		}` 
		};
		editor.execute( new AddScriptCommand( editor, editor.selected, script ) );

	} );
	container.add( newScript );

	// Compile button
	if (isElectron()) {
		const compileScript = new UIButton( 'Compile' );
		compileScript.setMarginLeft( '4px' );
		compileScript.onClick( function () {
			const editorContent = editor.codemirror.getValue();
			createAndCompileSketch(editorContent);
			console.log('Compile script clicked: ' + editorContent);
		});
		container.add( compileScript );
	}

	function setupArduinoCliIfNeeded() {
		if (isElectron()) {
			const setupFlagPath = path.join(__dirname, 'arduinoCliSetupDone.flag');

			fs.access(setupFlagPath, (exists) => {
				if (!exists) {
					setupArduinoCli(() => {
						console.log('Arduino CLI setup completed.');
						// Create a flag file to mark the setup as done
						fs.closeSync(fs.openSync(setupFlagPath, 'w'));
					});
				} else {
					console.log('Arduino CLI setup already completed.');
				}
			});
		} else {
			console.log("Compiler is not available in a standard web browser.");
		}
	}

	setupArduinoCliIfNeeded();

	function setupArduinoCli() {
	    // Detectar o sistema operacional
	    const osType = os.platform(); // 'darwin', 'win32', 'linux'
	    console.log('Detected OS:', osType); // Imprime o sistema operacional detectado
	    let relativeArduinoCliPath;

	    if (osType === 'darwin') {
	        relativeArduinoCliPath = '/arduino-cli_0.35.2_macOS_ARM64/arduino-cli';
	    } else if (osType === 'win32') {
	        relativeArduinoCliPath = '/arduino-cli_0.35.2_Windows_64bit/arduino-cli.exe';
	    } else if (osType === 'linux') {
	        relativeArduinoCliPath = '/arduino-cli_0.35.2_Linux_ARM64/arduino-cli';
	    } else {
	        console.error('Unsupported OS');
	        return;
	    }

	    const arduinoCliPath = path.join(__dirname, relativeArduinoCliPath);

	    // Comandos para configurar o Arduino CLI
	    const initCommand = `"${arduinoCliPath}" config init --overwrite`;
	    const addUrlCommand = `"${arduinoCliPath}" config add board_manager.additional_urls https://alexandermandera.github.io/arduino-wch32v003/package_ch32v003_index.json`;
	    const updateIndexCommand = `"${arduinoCliPath}" core update-index`;
	    const installCoreCommand = `"${arduinoCliPath}" core install alexandermandera:wch`;

	    // Executar cada comando em sequência
	    exec(initCommand, (initError, initStdout, initStderr) => {
	        if (initError || initStderr) {
	            console.error(`Arduino CLI Config Init Error: ${initError?.message || initStderr}`);
	            return;
	        }
	        console.log(`Arduino CLI Config Init Output: ${initStdout}`);

	        exec(addUrlCommand, (addUrlError, addUrlStdout, addUrlStderr) => {
	            if (addUrlError || addUrlStderr) {
	                console.error(`Arduino CLI Add URL Error: ${addUrlError?.message || addUrlStderr}`);
	                return;
	            }
	            console.log(`Arduino CLI Add URL Output: ${addUrlStdout}`);

	            exec(updateIndexCommand, (updateIndexError, updateIndexStdout, updateIndexStderr) => {
	                if (updateIndexError || updateIndexStderr) {
	                    console.error(`Arduino CLI Update Index Error: ${updateIndexError?.message || updateIndexStderr}`);
	                    return;
	                }
	                console.log(`Arduino CLI Update Index Output: ${updateIndexStdout}`);

	                exec(installCoreCommand, (installCoreError, installCoreStdout, installCoreStderr) => {
	                    if (installCoreError || installCoreStderr) {
	                        console.error(`Arduino CLI Install Core Error: ${installCoreError?.message || installCoreStderr}`);
	                        return;
	                    }
	                    console.log(`Arduino CLI Install Core Output: ${installCoreStdout}`);
	                    // Now that the prerequisites are set up, you can call other functions like createAndCompileSketch
	                });
	            });
	        });
	    });
	}
	
	function createAndCompileSketch(editorContent) {
		if (isElectron()) {
			// Create a temporary directory for the sketch with a 'sketch' prefix
			const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), projectId));

			// Extract the unique part of the temporary directory name
			const dirName = path.basename(tempDir);

			// Use the unique part to create a .ino file with the same name as the directory
			const sketchFileName = projectId + '.ino';
			const sketchPath = path.join(tempDir, sketchFileName);

			// Write the editor content to the .ino file
			fs.writeFileSync(sketchPath, editorContent);
			console.log('Sketch file created at:', sketchPath);

			// Compile the sketch using the Arduino CLI
			compileSketch(tempDir); // Pass only the directory, as the file name is now the same as the directory
		} else {
			console.log("Compiling sketches is not supported in a standard web browser.");
		}
	}

	// Function to compile an Arduino sketch using the local Arduino CLI
	function compileSketch(sketchPath) {
		if (isElectron()) {
			const osType = os.platform(); // Detectar o sistema operacional novamente
			console.log('Detected OS:', osType); // Imprime o sistema operacional detectado
			let relativeArduinoCliPath;

			if (osType === 'darwin') {
				relativeArduinoCliPath = '/arduino-cli_0.35.2_macOS_ARM64/arduino-cli';
			} else if (osType === 'win32') {
				relativeArduinoCliPath = '/arduino-cli_0.35.2_Windows_64bit/arduino-cli.exe';
			} else if (osType === 'linux') {
				relativeArduinoCliPath = '/arduino-cli_0.35.2_Linux_ARM64/arduino-cli';
			} else {
				console.error('Unsupported OS');
				return;
			}

			const arduinoCliPath = path.join(__dirname, relativeArduinoCliPath);
			const fqbn = 'alexandermandera:wch:wch32v003'; // Set the correct FQBN for the WCH CH32V003 board

			// Compile command
			const compileCommand = `"${arduinoCliPath}" compile --fqbn ${fqbn} "${sketchPath}"`;

			exec(compileCommand, (compileError, compileStdout, compileStderr) => {
				if (compileError) {
					console.error(`Compile Error: ${compileError.message}`);
					return;
				}
				if (compileStderr) {
					console.error(`Compile Stderr: ${compileStderr}`);
					return;
				}
				console.log(`Compile Output: ${compileStdout}`);

				// If compilation succeeds, proceed with uploading the sketch
				uploadSketch(sketchPath, arduinoCliPath);
			});
		} else {
			console.log("Compiling sketches is not supported in a standard web browser.");
		}
	}

	function uploadSketch(sketchPath, arduinoCliPath) {
		if (isElectron()) {
			// Command to list all connected boards
			const listBoardsCommand = `"${arduinoCliPath}" board list`;

			exec(listBoardsCommand, (error, stdout, stderr) => {
				if (error) {
					console.error(`Error listing boards: ${error.message}`);
					return;
				}
				if (stderr) {
					console.error(`Error listing boards: ${stderr}`);
					return;
				}

				// Parse the stdout to find the port
				// This is a basic example and might need adjustments based on your output
				const lines = stdout.split('\n');
				let port = '';
				for (let line of lines) {
					if (line.includes('Serial Port (USB)')) {
						const parts = line.split(/\s+/); // Split by whitespace
						port = parts[0]; // Assuming the first part is the port
						break;
					}
				}

				if (port) {
					// If a port is found, proceed with the upload
					const fqbn = 'alexandermandera:wch:wch32v003'; // Set the correct FQBN for the WCH CH32V003 board
            		const uploadCommand = `"${arduinoCliPath}" upload -b ${fqbn} -p ${port} "${sketchPath}"`;

					exec(uploadCommand, (uploadError, uploadStdout, uploadStderr) => {
						if (uploadError) {
							console.error(`Upload Error: ${uploadError.message}`);
							return;
						}
						if (uploadStderr) {
							console.error(`Upload Stderr: ${uploadStderr}`);
							return;
						}
						console.log(`Upload Output: ${uploadStdout}`);
					});
				} else {
					console.error('No Arduino Uno found on any port.');
				}
			});
		} else {
			console.log("Uploading sketches is not supported in a standard web browser.");
		}
	}

	/*
	let loadScript = new UI.Button( 'Load' );
	loadScript.setMarginLeft( '4px' );
	container.add( loadScript );
	*/

	//

	function update() {

		scriptsContainer.clear();
		scriptsContainer.setDisplay( 'none' );

		const object = editor.selected;

		if ( object === null ) {

			return;

		}

		const scripts = editor.scripts[ object.uuid ];

		if ( scripts !== undefined && scripts.length > 0 ) {

			scriptsContainer.setDisplay( 'block' );

			for ( let i = 0; i < scripts.length; i ++ ) {

				( function ( object, script ) {

					const name = new UIInput( script.name ).setWidth( '130px' ).setFontSize( '12px' );
					name.onChange( function () {

						editor.execute( new SetScriptValueCommand( editor, editor.selected, script, 'name', this.getValue() ) );

					} );
					scriptsContainer.add( name );

					const edit = new UIButton( strings.getKey( 'sidebar/script/edit' ) );
					edit.setMarginLeft( '4px' );
					edit.onClick( function () {

						signals.editScript.dispatch( object, script );

					} );
					scriptsContainer.add( edit );

					const remove = new UIButton( strings.getKey( 'sidebar/script/remove' ) );
					remove.setMarginLeft( '4px' );
					remove.onClick( function () {

						if ( confirm( 'Are you sure?' ) ) {

							editor.execute( new RemoveScriptCommand( editor, editor.selected, script ) );

						}

					} );
					scriptsContainer.add( remove );

					scriptsContainer.add( new UIBreak() );

				} )( object, scripts[ i ] );

			}

		}

	}

	// signals

	signals.objectSelected.add( function ( object ) {

		if ( object !== null && editor.camera !== object ) {

			container.setDisplay( 'block' );

			update();

		} else {

			container.setDisplay( 'none' );

		}

	} );

	signals.scriptAdded.add( update );
	signals.scriptRemoved.add( update );
	signals.scriptChanged.add( update );

	editor.codemirror.on('change', function() {
		console.log('O código foi modificado.');
		window.editorContent = editor.codemirror.getValue(); // Armazena o conteúdo atual do editor em uma variável global
		//console.log(window.editorContent); // Imprime o conteúdo atual do editor armazenado globalmente
	});

	return container;

}

export { SidebarScript };
