import { TextDocument, WorkspaceConfiguration } from "vscode";
import { configs, lfPrefix } from "./constants";

type FileNameBuilderProps = {
  document: TextDocument;
  config: WorkspaceConfiguration;
};

export default function fileNameBuilder(props: FileNameBuilderProps) {
  return alwaysUniqueBuilder(props);
  // return depth3Builder(document);
}

function alwaysUniqueBuilder(props: FileNameBuilderProps) {
  const mLD = props.config.get<number>(configs.maxLocationDepth);
  const lD = props.config.get<number>(configs.locationDepth);

  const parts = props.document.fileName.split("/");
  if (!parts.length) return lfPrefix + "unknown";
  const fileName = parts.pop() as string;
  if (!parts.length || lD === 0) return lfPrefix + fileName;

  let unique = !fileName.includes("index");
  let pathName = fileName;
  let depth = 0;
  for (let i = parts.length - 1; i >= 0; i--) {
    pathName = parts[i] + "/" + pathName;
    depth++;
    unique = unique || isUnique(parts[i]);
    if (!lD && (unique || depth === mLD)) return lfPrefix + pathName;
    if (depth === lD) return lfPrefix + pathName;
  }
  return lfPrefix + pathName;
}

function isUnique(pathPart: string) {
  return pathPart !== "index" && pathPart[0] !== "[";
}
