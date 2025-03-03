export default function ecmaScriptExtension(file: string) {
  const splitted = file.split(".");

  const ext = splitted[splitted.length - 1];

  if (ext !== "js" && ext !== "ts" && ext !== "jsx" && ext !== "tsx")
    return false;

  return ext;
}
