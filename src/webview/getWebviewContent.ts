import * as vscode from "vscode";
import { TermSnapConfig } from "../config";

export function getWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  terminalText: string,
  config: TermSnapConfig
): string {
  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "webview", "styles.css")
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "webview", "script.js")
  );
  const htmlToImageUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      extensionUri,
      "media",
      "webview",
      "html-to-image.min.js"
    )
  );

  const nonce = getNonce();

  // Escape HTML entities in terminal text
  const escapedText = terminalText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
  <link href="${stylesUri}" rel="stylesheet">
  <title>TermSnap Preview</title>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-group">
      <label for="theme-select">Theme</label>
      <select id="theme-select">
        <option value="dracula" ${config.theme === "dracula" ? "selected" : ""}>Dracula</option>
        <option value="one-dark" ${config.theme === "one-dark" ? "selected" : ""}>One Dark</option>
        <option value="monokai" ${config.theme === "monokai" ? "selected" : ""}>Monokai</option>
        <option value="solarized-dark" ${config.theme === "solarized-dark" ? "selected" : ""}>Solarized Dark</option>
        <option value="night-owl" ${config.theme === "night-owl" ? "selected" : ""}>Night Owl</option>
        <option value="github-dark" ${config.theme === "github-dark" ? "selected" : ""}>GitHub Dark</option>
        <option value="catppuccin-mocha" ${config.theme === "catppuccin-mocha" ? "selected" : ""}>Catppuccin Mocha</option>
        <option value="tokyo-night" ${config.theme === "tokyo-night" ? "selected" : ""}>Tokyo Night</option>
        <option value="gruvbox-dark" ${config.theme === "gruvbox-dark" ? "selected" : ""}>Gruvbox Dark</option>
        <option value="nord" ${config.theme === "nord" ? "selected" : ""}>Nord</option>
        <option value="solarized-light" ${config.theme === "solarized-light" ? "selected" : ""}>Solarized Light</option>
        <option value="custom" ${config.theme === "custom" ? "selected" : ""}>Custom</option>
      </select>
    </div>
    <div class="toolbar-group">
      <label for="font-size">Font Size: <span id="font-size-value">${config.fontSize}</span>px</label>
      <input type="range" id="font-size" min="10" max="24" value="${config.fontSize}">
    </div>
    <div class="toolbar-group">
      <label for="padding">Padding: <span id="padding-value">${config.padding}</span>px</label>
      <input type="range" id="padding" min="0" max="64" value="${config.padding}">
    </div>
    <div class="toolbar-group">
      <label>
        <input type="checkbox" id="window-controls" ${config.showWindowControls ? "checked" : ""}>
        Window Controls
      </label>
    </div>
    <div class="toolbar-group">
      <label>
        <input type="checkbox" id="line-numbers" ${config.showLineNumbers ? "checked" : ""}>
        Line Numbers
      </label>
    </div>
    <div class="toolbar-group toolbar-actions">
      <button id="btn-save" class="btn btn-primary">Save as PNG</button>
      <button id="btn-copy" class="btn btn-secondary">Copy Image</button>
      <button id="btn-copy-text" class="btn btn-secondary">Copy Text</button>
    </div>
  </div>

  <div class="preview-container">
    <div id="capture-area" class="outer-background">
      <div id="terminal-window" class="terminal-window theme-${config.theme}">
        <div id="title-bar" class="title-bar">
          <div class="window-controls">
            <span class="dot dot-red"></span>
            <span class="dot dot-yellow"></span>
            <span class="dot dot-green"></span>
          </div>
          <div class="title-text">Terminal</div>
          <div class="title-spacer"></div>
        </div>
        <div id="terminal-body" class="terminal-body">
          <pre id="terminal-text">${escapedText}</pre>
        </div>
      </div>
    </div>
  </div>

  <script nonce="${nonce}" src="${htmlToImageUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
  <script nonce="${nonce}">
    initTermSnap(${JSON.stringify({ text: escapedText, config })});
  </script>
</body>
</html>`;
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
