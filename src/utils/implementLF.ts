import * as vscode from "vscode";
import ecmaScriptValidator from "./ecmaScript.validator";
import { lf, lfJS, lfPrefix, lfSig, lfTS, rootConfig } from "./constants";
import ignoreFileValidator from "./ignoreFile.validator";
import fileNameBuilder from "./fileNameBuilder";

type ImplementLFProps = {
  document: vscode.TextDocument;
  oldUri?: vscode.Uri;
  overrideIgnore?: boolean;
};
export default async function implementLF({
  document,
  oldUri,
  overrideIgnore,
}: ImplementLFProps) {
  const validLanguage = ecmaScriptValidator(document);
  if (!validLanguage) return;

  const docText = document.getText();

  const validFileContent = ignoreFileValidator(docText);

  if (!validFileContent && !overrideIgnore) return;

  const config = vscode.workspace.getConfiguration(rootConfig);
  const fileName = fileNameBuilder({ document, config });

  let newText = docText
    .split("\n")
    .map((line, index) => {
      const signature = lfSig + (index + 1) + ")";
      if (line.includes(signature)) return line;
      const logMatch = /\b(log|warn|error)\b\((.*)\)/.exec(line);
      if (logMatch) {
        const logType = logMatch[1];
        let logContent = logMatch[2];
        if (logContent.includes(lfSig)) {
          logContent = logContent.split(",").slice(1).join().trimStart();
        }
        return line.replace(
          logMatch[0],
          logType + `(${signature}, ${logContent})`
        );
      }
      return line;
    })
    .join("\n");

  if (newText.includes(lfSig) && !newText.includes(lf)) {
    const func = validLanguage.includes("typescript") ? lfTS : lfJS;
    newText +=
      "\n" +
      func +
      ` return "${fileName}:"+n+" >"
 // Automatically injected by Log Location Injector vscode extension
      }`;
  } else if (oldUri) {
    const oldFileName =
      lfPrefix + oldUri.path.split("/").slice(-2).join("/") || "unknown";
    newText = newText.replace(oldFileName, fileName);
  }

  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );

  const edit = new vscode.WorkspaceEdit();
  edit.replace(document.uri, fullRange, newText);
  await vscode.workspace.applyEdit(edit);
  await vscode.workspace.save(document.uri);
}
