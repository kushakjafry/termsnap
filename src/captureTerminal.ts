import * as vscode from "vscode";

export async function captureTerminalSelection(): Promise<string | undefined> {
  // Copy the current terminal selection to clipboard
  await vscode.commands.executeCommand(
    "workbench.action.terminal.copySelection"
  );

  // Small delay to ensure clipboard is updated
  await new Promise((resolve) => setTimeout(resolve, 100));

  const text = await vscode.env.clipboard.readText();

  if (!text || text.trim().length === 0) {
    vscode.window.showErrorMessage(
      "TermSnap: No terminal text selected. Select text in the terminal first."
    );
    return undefined;
  }

  return text;
}
