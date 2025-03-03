import { TextDocument } from "vscode";

export default function ecmaScriptValidator(doc: TextDocument) {
  if (
    doc.languageId !== "javascript" &&
    doc.languageId !== "typescript" &&
    doc.languageId !== "javascriptreact" &&
    doc.languageId !== "typescriptreact"
  )
    return false;
  return doc.languageId;
}
