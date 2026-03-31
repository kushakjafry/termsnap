import * as vscode from "vscode";
import { getWebviewContent } from "./getWebviewContent";
import { handleMessage } from "./messageHandler";
import { getConfig } from "../config";

let currentPanel: vscode.WebviewPanel | undefined;
let storedExtensionUri: vscode.Uri | undefined;

export function createOrShowPanel(
  extensionUri: vscode.Uri,
  terminalText: string
): vscode.WebviewPanel {
  storedExtensionUri = extensionUri;
  const config = getConfig();

  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.Beside);
    currentPanel.webview.html = getWebviewContent(
      currentPanel.webview,
      extensionUri,
      terminalText,
      config
    );
    return currentPanel;
  }

  const panel = vscode.window.createWebviewPanel(
    "termsnap.preview",
    "TermSnap Preview",
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, "media", "webview"),
      ],
      retainContextWhenHidden: true,
    }
  );

  currentPanel = panel;

  panel.webview.html = getWebviewContent(
    panel.webview,
    extensionUri,
    terminalText,
    config
  );

  panel.webview.onDidReceiveMessage((message) =>
    handleMessage(message, panel)
  );

  panel.onDidDispose(() => {
    currentPanel = undefined;
  });

  return panel;
}
