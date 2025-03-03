import { ASTNode, Pattern } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type CallbacksPipelineProps = {
  ip: InjectionPipeline;
  callbacksTemplate: string;
  outputLocation: string;
  callbackNodes: ASTNode[];
  params: PatternKind[];
  sourceFile: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateOutputLocation: string;
  stateName: string;
};
export default async function callbacksPipeline({
  ip,
  callbackNodes,
  callbacksTemplate,
  outputLocation,
  params,
  stateName,
  stateOutputLocation,
  sourceFile,
  propertyNames,
  functionName,
}: CallbacksPipelineProps) {
  await ip
    .parseString({
      text: callbacksTemplate,
      outputLocation,
    })
    .injectFunctionBody({ nodes: callbackNodes }, { name: functionName })
    .injectImportsFromFile(
      { origin: { source: sourceFile, type: "source" } },
      {}
    )
    .injectReturnAllFunctionVariables({}, { name: functionName })
    .injectStringTemplate({
      position: "lastLine",
      template: `export type ${functionName}Return = ReturnType <typeof ${functionName}>`,
    })
    .injectFunctionParams(
      { stringTemplate: `state: ${stateName}Return` },
      { name: functionName }
    )
    .injectFunctionParams({ nodes: params }, { name: functionName })
    .customInject((ip) => {
      for (const property of Object.keys(propertyNames)) {
        ip.injectObjectForAccessors({
          accessors: propertyNames[property],
          objectName: property,
        });
      }
    })
    .injectImport({
      importName: `${stateName}Return`,
      source: "./state.tsx",
    })
    .injectImport({
      importName: functionName + "Props",
      source: "./state.tsx",
    })
    .injectObjectForAccessors({
      objectName: "state",
      accessors: (ip) => {
        return ip.pipelineStore[stateOutputLocation].variableNames;
      },
    })
    .storeFileVariables()
    .finish();
}
