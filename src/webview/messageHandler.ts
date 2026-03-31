import * as vscode from "vscode";
import { exec } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { writeFileSync, unlinkSync } from "fs";
import { updateConfig } from "../config";

interface SaveMessage {
  type: "save";
  dataUrl: string;
}

interface CopyMessage {
  type: "copy";
  dataUrl: string;
}

interface CopyTextMessage {
  type: "copyText";
  text: string;
}

interface SettingsChangedMessage {
  type: "settingsChanged";
  key: string;
  value: unknown;
}

type WebviewMessage = SaveMessage | CopyMessage | CopyTextMessage | SettingsChangedMessage;

export async function handleMessage(
  message: WebviewMessage,
  panel: vscode.WebviewPanel
): Promise<void> {
  switch (message.type) {
    case "save":
      await handleSave(message.dataUrl);
      break;
    case "copy":
      await handleCopy(message.dataUrl, panel);
      break;
    case "copyText":
      await vscode.env.clipboard.writeText(message.text);
      vscode.window.showInformationMessage("TermSnap: Text copied to clipboard!");
      break;
    case "settingsChanged":
      await handleSettingsChanged(message.key, message.value);
      break;
  }
}

async function handleSave(dataUrl: string): Promise<void> {
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file("termsnap.png"),
    filters: { "PNG Image": ["png"] },
  });

  if (!uri) {
    return;
  }

  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  await vscode.workspace.fs.writeFile(uri, buffer);
  vscode.window.showInformationMessage(`TermSnap: Screenshot saved to ${uri.fsPath}`);
}

async function handleCopy(
  dataUrl: string,
  _panel: vscode.WebviewPanel
): Promise<void> {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const tmpFile = join(tmpdir(), `termsnap-${Date.now()}.png`);

  try {
    writeFileSync(tmpFile, buffer);

    if (process.platform === "darwin") {
      await runCommand(
        `osascript -e 'set the clipboard to (read (POSIX file "${tmpFile}") as «class PNGf»)'`
      );
    } else if (process.platform === "linux") {
      await runCommand(`xclip -selection clipboard -t image/png -i "${tmpFile}"`);
    } else {
      // Windows: use PowerShell
      await runCommand(
        `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${tmpFile}'))"`
      );
    }

    vscode.window.showInformationMessage("TermSnap: Screenshot copied to clipboard!");
  } catch (err) {
    vscode.window.showErrorMessage(
      `TermSnap: Failed to copy image to clipboard. ${err}`
    );
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }
}

function runCommand(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function handleSettingsChanged(
  key: string,
  value: unknown
): Promise<void> {
  await updateConfig(key, value);
}
