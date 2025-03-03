import { ASTNode, Pattern } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type CallbacksPipelineProps = {
  ip: InjectionPipeline;
  callbacksTemplate: string;
  outputLocation: string;
  callbackNodes: ASTNode[];
  params: PatternKind[];
  source: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateLocation: string;
  stateName: string;
  callbacksName: string;
};
export default async function callbacksPipeline({
  ip,
  callbackNodes,
  callbacksTemplate,
  outputLocation,
  params,
  stateName,
  stateLocation,
  source,
  propertyNames,
  functionName,
  callbacksName,
}: CallbacksPipelineProps) {
  await ip
    .parseString({
      text: callbacksTemplate,
      outputLocation,
    })
    .injectFunctionBody({ nodes: callbackNodes }, { name: callbacksName })
    .injectImportsFromFile({ origin: { source, type: "source" } }, {})
    .injectReturnAllFunctionVariables({}, { name: callbacksName })
    .injectStringTemplate({
      position: "lastLine",
      template: `export type ${callbacksName}Return = ReturnType <typeof ${callbacksName}>`,
    })
    .injectFunctionParams(
      { stringTemplate: `state: ${stateName}Return` },
      { name: callbacksName }
    )
    .injectFunctionParams({ nodes: params }, { name: callbacksName })
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
        return ip.pipelineStore[stateLocation].variableNames;
      },
    })
    .storeFileVariables()
    .finish();
}
