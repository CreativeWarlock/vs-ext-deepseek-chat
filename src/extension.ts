import * as vscode from "vscode";
import ollama from "ollama";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vs-ext-deepseek-chat" is now active!'
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand(
    "vs-ext-deepseek-chat.deepSeekChat",
    () => {
      vscode.window.showInformationMessage("Starting DeepSeek chat!");

      const panel = vscode.window.createWebviewPanel(
        "deepChat",
        "Deep Seek Chat",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      panel.webview.html = getWebviewContent();

      panel.webview.onDidReceiveMessage(async (message: any) => {
        if (message.command === "abort") {
          ollama.abort();
        }
        if (message.command === "chat") {
          //const askBtn = document.getElementById("askBtn");
          //if (askBtn) askBtn.setAttribute("disabled", "false");

          const userPrompt = message.text;
          let responseText = "";

          try {
            const streamResponse = await ollama.chat({
              model: "deepseek-r1:32b",
              messages: [{ role: "user", content: userPrompt }],
              stream: true,
            });

            for await (const part of streamResponse) {
              responseText += part.message.content;
              panel.webview.postMessage({
                command: "chatResponse",
                text: responseText,
              });
            }
          } catch (err) {
            vscode.window.showErrorMessage("" + err);
          }
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
  return /*html*/ ` 
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        body { font-family: sans-serif; margin: 1rem; }
        #prompt { width: 100%; box-sizing: border-box; }
        #response { border: 1px solid #ccc; margin-top: 1rem; padding 0.5rem; min-height: 1rem; }
      </style>
    </head>
    <body>
      <h2>Chat wth Deep Seek</h2>
      <textarea id="prompt" rows="3" placeholder="Ask me..."></textarea><br />
      <button id="askBtn">Ask</button>
      <button id="abortBtn">Abort</button>
      <div id="response"></div>

      <script>
        const vscode = acquireVsCodeApi();

        document.getElementById('askBtn').addEventListener('click', () => {
          //this.setAttribute("disabled", "false");
          //this.disabled = true;
          const text = document.getElementById('prompt').value;
          vscode.postMessage({ command: 'chat', text })
        })

        document.getElementById('abortBtn').addEventListener('click', () => {
          vscode.postMessage({ command: 'abort' })
        })

        window.addEventListener('message', event => {
          const { command, text } = event.data;
          if (command === 'chatResponse') {
            document.getElementById('response').innerText = text;
          }
        })

      </script>
    </body>
    </html>
  `;
}

// This method is called when your extension is deactivated
export function deactivate() {}
