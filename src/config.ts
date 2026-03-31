import * as vscode from "vscode";

export interface TermSnapConfig {
  theme: string;
  fontSize: number;
  padding: number;
  showWindowControls: boolean;
  showLineNumbers: boolean;
  backgroundColor: string;
  customBackground: string;
  customTextColor: string;
  customTitleBarColor: string;
}

export function getConfig(): TermSnapConfig {
  const config = vscode.workspace.getConfiguration("termsnap");
  return {
    theme: config.get<string>("theme", "dracula"),
    fontSize: config.get<number>("fontSize", 14),
    padding: config.get<number>("padding", 16),
    showWindowControls: config.get<boolean>("showWindowControls", true),
    showLineNumbers: config.get<boolean>("showLineNumbers", false),
    backgroundColor: config.get<string>("backgroundColor", "#1e1e2e"),
    customBackground: config.get<string>("customBackground", "#1e1e2e"),
    customTextColor: config.get<string>("customTextColor", "#f8f8f2"),
    customTitleBarColor: config.get<string>("customTitleBarColor", "#161616"),
  };
}

export async function updateConfig(
  key: string,
  value: unknown
): Promise<void> {
  const config = vscode.workspace.getConfiguration("termsnap");
  await config.update(key, value, vscode.ConfigurationTarget.Global);
}
