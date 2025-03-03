import * as vscode from "vscode";
import ecmaScriptValidator from "../../utils/ecmaScript.validator";
import splitFilePipeline from "./pipeline";

export default async function splitFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return null;

  const document = editor.document;

  const validLanguage = ecmaScriptValidator(document);
  if (!validLanguage) return;

  let fileName = document.fileName.split("/").pop();
  if (!fileName) return;
  const split = fileName.split(".");
  fileName = split
    .slice(0, split.length - 1)
    .map((t) => t[0].toUpperCase() + t.slice(1))
    .join("");
  if (!fileName) return;

  const documentText = document.getText();

  const fileLocation = document.uri.path;

  console.dir(document.uri);

  let splitPaths = fileLocation.split("/");
  splitPaths = splitPaths.slice(0, splitPaths.length - 1);
  const currDirectory = splitPaths.join("/");

  await splitFilePipeline({
    documentText,
    fileLocation,
    fileName,
    currDirectory,
  });

  vscode.window.showInformationMessage("React File Splitter - 🔥");
  // let newText = "";

  // const fullRange = new vscode.Range(
  //   document.positionAt(0),
  //   document.positionAt(document.getText().length)
  // );

  // const edit = new vscode.WorkspaceEdit();
  // edit.replace(document.uri, fullRange, newText);
  // await vscode.workspace.applyEdit(edit);
  // await vscode.workspace.save(document.uri);
}
