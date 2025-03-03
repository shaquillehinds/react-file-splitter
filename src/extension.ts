import * as vscode from "vscode";
import splitFile from "./commands/splitFile";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    $lf(5),
    'Congratulations, your extension "react-file-splitter" is now active!'
  );

  const splitFileDisposable = vscode.commands.registerCommand(
    "react-file-splitter.splitFile",
    splitFile
  );

  context.subscriptions.push(splitFileDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function $lf(n: number) {
  return "$lf|react-file-splitter/src/extension.ts:" + n + " >";
  // Automatically injected by Log Location Injector vscode extension
}
