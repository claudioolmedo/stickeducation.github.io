import { UIPanel, UIRow, UIInput, UIText, UISpan, UIButton } from './libs/ui.js';

import { GoogleGenerativeAI } from "@google/generative-ai";

import { addstick } from './Menubar.Add.js';

function SidebarAI(editor) {
    const config = editor.config;
    const signals = editor.signals;
    const strings = editor.strings;
    const container = new UISpan();

    const settings = new UIPanel();
    settings.setBorderTop('0');
    settings.setPaddingTop('20px');
    container.add(settings);

    const titleRow = new UIRow();
    const title = new UIInput(config.getKey('AI/title')).setLeft('100px').setWidth('150px').onChange(function () {

        config.setKey('AI/title', this.getValue());

    });
    function performAction(action) {
        switch (action) {
            case 'build a stick':
                // Logic to build a stick or navigate the user to the appropriate part of the app
                try {
                    addstick(editor);// function call
                    console.log('Stick has been built and added to the scene.');
                } catch (error) {
                    console.error('Failed to build a stick:', error);
                }
                break;
            // Add more cases for other actions as needed
            default:
                console.log(`Action "${action}" is not recognized.`);
                break;
        }
    }

    
// Add chatbot functionality
    const chatContainer = new UIPanel();
    const chatTitle = new UIText("Chat with AI").setWidth('90px');
    chatContainer.add(chatTitle);

    const chatMessages = new UIPanel();
    //    chatMessages.setHeight('575px').setWidth('250px').setOverflow('auto').setBorder('1px solid #ccc').setMargin('10px 0');

    chatMessages.setHeight('360px').setWidth('250px').setOverflow('auto').setBorder('1px solid #ccc').setMargin('10px 0');
    chatContainer.add(chatMessages);

    const chatInput = new UIInput('').setWidth('200px');
    const sendButton = new UIButton('Send').onClick(sendMessage) 

    const chatInputRow = new UIRow();
    chatInputRow.add(chatInput);
    chatInputRow.add(sendButton);
    chatContainer.add(chatInputRow);
   
// Function to send message
    // Function to send message
    async function sendMessage() {
        const message = chatInput.getValue();
        if (message.trim() !== '') {
            const userMessage = new UIText('You: ' + message);
            const userMessageRow = new UIRow();
            userMessageRow.add(userMessage);
            chatMessages.add(userMessageRow);

            try {
                const { response, action } = await getBotResponse(message);
                const botResponse = "Bot: " + response;
                const formattedResponse = formatResponse(botResponse);
                
                const botMessageElement = document.createElement('div');
                botMessageElement.className = 'formatted-response';
                botMessageElement.innerHTML = formattedResponse; // Set the formatted HTML as innerHTML

            // Append the new element to the chatMessages container
                 chatMessages.dom.appendChild(botMessageElement);
                
                const botMessageRow = new UIRow();
                chatMessages.add(botMessageRow);
                if (action) {
                    // Add a button for the user to click if they want the chatbot to perform the action
                    const actionButton = new UIButton('Yes, please').onClick(() => performAction(action));
                    botMessageRow.add(actionButton);
                }
            } catch (error) {
                console.error('Error fetching bot response:', error);
                const errorMessage = new UIText('Bot: Oops! Something went wrong.');
                const errorMessageRow = new UIRow();
                errorMessageRow.add(errorMessage);
                chatMessages.add(errorMessageRow);
            }

            chatInput.setValue('');
        }
    }


//Event listener for 'Enter' key press
    chatInput.dom.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    container.add(chatContainer);

// Function to get bot response from the API
    async function getBotResponse(message) {

        const customResponses = {
            'build a stick': 'To build a stick, go to the "Add" tab and select "Stick" from the list. Or, do you want me to build it for you? [Build it]',
            // Add more intents and responses as needed
        };
        const intent = Object.keys(customResponses).find(intent => message.toLowerCase().includes(intent));
        if (intent) {
            return { response: customResponses[intent], action: intent }; // Include the action with the response
        }else{
    
            const genAI = new GoogleGenerativeAI("AIzaSyC5X1lPoNZfMnN7OcQfFiKo7Xc0wxUNSG0");
            const model = genAI.getGenerativeModel({ model: "gemini-pro"});
            const result = await model.generateContentStream(message);
            let botResponse = '';
            for await(const chunk of result.stream){
                const chunkText=chunk.text();
                botResponse += chunkText;
            //console.log(chunkText);
            }
            return { response: botResponse, action: null }; 
        }
        
    }

    function formatResponse(response) {
        // Convert plain text to HTML formatted string
        const htmlResponse = response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold with **
            .replace(/\n/g, '<br>') // New lines to <br>
            .replace(/(1\. .*?)(<br>)/g, '<li>$1</li>') // Convert numbered list items to <li>
            .replace(/(2\. .*?)(<br>)/g, '<li>$1</li>') // Convert numbered list items to <li>
            // Add more replacements as needed for other Markdown features
    
        // Wrap the response in a <div> for styling if needed
        return htmlResponse;
    }
// Signals
    signals.editorCleared.add(function () {
        title.setValue('');
        config.setKey('AI/title', '');
    });

return container;
}

export { SidebarAI };
