import { ASTNode } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type EffectsPipelineProps = {
  ip: InjectionPipeline;
  effectsTemplate: string;
  outputLocation: string;
  effectNodes: ASTNode[];
  params: PatternKind[];
  source: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateLocation: string;
  stateName: string;
  callbacksLocation: string;
  callbacksName: string;
  effectsName: string;
};
export default async function effectsPipeline({
  ip,
  callbacksName,
  callbacksLocation,
  effectNodes,
  effectsTemplate,
  outputLocation,
  params,
  stateName,
  stateLocation,
  source,
  propertyNames,
  functionName,
  effectsName,
}: EffectsPipelineProps) {
  await ip
    .parseString({
      text: effectsTemplate,
      outputLocation,
    })
    .injectFunctionBody({ nodes: effectNodes }, { name: effectsName })
    .injectImportsFromFile({ origin: { source, type: "source" } }, {})
    .injectFunctionParams(
      {
        stringTemplate: `state: ${stateName}Return, callbacks: ${callbacksName}Return`,
      },
      { name: effectsName }
    )
    .injectFunctionParams({ nodes: params }, { name: effectsName })
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
        accessors: cp.pipelineStore[stateLocation].variableNames,
      });
      cp.injectObjectForAccessors({
        objectName: "callbacks",
        accessors: cp.pipelineStore[callbacksLocation].variableNames,
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
