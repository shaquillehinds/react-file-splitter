import { ASTNode } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type EffectsPipelineProps = {
  ip: InjectionPipeline;
  effectsTemplate: string;
  outputLocation: string;
  effectNodes: ASTNode[];
  params: PatternKind[];
  sourceFile: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateOutputLocation: string;
  stateName: string;
  callbacksOutputLocation: string;
  callbacksName: string;
};
export default async function effectsPipeline({
  ip,
  callbacksName,
  callbacksOutputLocation,
  effectNodes,
  effectsTemplate,
  outputLocation,
  params,
  stateName,
  stateOutputLocation,
  sourceFile,
  propertyNames,
  functionName,
}: EffectsPipelineProps) {
  await ip
    .parseString({
      text: effectsTemplate,
      outputLocation,
    })
    .injectFunctionBody({ nodes: effectNodes }, { name: functionName })
    .injectImportsFromFile(
      { origin: { source: sourceFile, type: "source" } },
      {}
    )
    .injectFunctionParams(
      {
        stringTemplate: `state: ${stateName}Return, callbacks: ${callbacksName}Return`,
      },
      { name: functionName }
    )
    .injectFunctionParams({ nodes: params }, { name: functionName })
    .injectImport({
      importName: `${functionName}Props`,
      source: "./state.tsx",
    })
    .injectImport({
      importName: `${stateName}Return`,
      source: "./state.tsx",
    })
    .injectImport({
      importName: `${callbacksName}Return`,
      source: "./callbacks.tsx",
    })
    .customInject((cp) => {
      cp.injectObjectForAccessors({
        objectName: "state",
        accessors: cp.pipelineStore[stateOutputLocation].variableNames,
      });
      cp.injectObjectForAccessors({
        objectName: "callbacks",
        accessors: cp.pipelineStore[callbacksOutputLocation].variableNames,
      });
      for (const property of Object.keys(propertyNames)) {
        cp.injectObjectForAccessors({
          accessors: propertyNames[property],
          objectName: property,
        });
      }
    })
    .finish();
}
