import * as vscode from "vscode";
import { captureTerminalSelection } from "./captureTerminal";
import { createOrShowPanel } from "./webview/webviewPanel";

export function activate(context: vscode.ExtensionContext) {
  const captureCommand = vscode.commands.registerCommand(
    "termsnap.capture",
    async () => {
      const text = await captureTerminalSelection();
      if (!text) {
        return;
      }
      createOrShowPanel(context.extensionUri, text);
    }
  );

  context.subscriptions.push(captureCommand);
}

export function deactivate() {}
