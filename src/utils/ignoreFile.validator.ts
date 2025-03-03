import { ignoreSig } from "./constants";

export default function ignoreFileValidator(docText: string) {
  if (docText.includes(ignoreSig)) return;
  return docText;
}
