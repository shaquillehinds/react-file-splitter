import { readFileSync } from "fs";
import splitFilePipeline from "./commands/splitFile/pipeline";

const currDirectory = "./temp";
const testFile = currDirectory + "/testingFile.tsx";

splitFilePipeline({
  documentText: readFileSync(testFile, { encoding: "utf-8" }),
  fileLocation: testFile,
  fileName: "testingFile",
  currDirectory,
});
