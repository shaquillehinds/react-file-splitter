import { ASTNode } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type ControllerPipelineProps = {
  ip: InjectionPipeline;
  outputLocation: string;
  controllerTemplate: string;
  controllerNodes: ASTNode[];
  params: PatternKind[];
  sourceFile: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateOutputLocation: string;
  stateName: string;
  callbacksOutputLocation: string;
  callbacksName: string;
  effectsName: string;
};
export default async function controllerPipeline({
  ip,
  effectsName,
  controllerTemplate,
  controllerNodes,
  callbacksName,
  callbacksOutputLocation,
  outputLocation,
  params,
  stateName,
  stateOutputLocation,
  sourceFile,
  propertyNames,
  functionName,
}: ControllerPipelineProps) {
  await ip
    .parseString({
      text: controllerTemplate,
      outputLocation,
    })
    .injectFunctionBody(
      {
        stringTemplate: ` const state = ${stateName}(props);
  const callbacks = ${callbacksName}(state, props)
  ${effectsName}(state, callbacks, props)`,
      },
      { name: functionName }
    )
    .injectFunctionBody({ nodes: controllerNodes }, { name: functionName })
    .injectImportsFromFile(
      { origin: { source: sourceFile, type: "source" } },
      {}
    )
    .injectFunctionParams({ nodes: params }, { name: functionName })
    .injectImport({
      importName: `${functionName}Props`,
      source: "./state.tsx",
    })
    .injectImport({
      importName: stateName,
      source: "./state.tsx",
    })
    .injectImport({
      importName: callbacksName,
      source: "./callbacks.tsx",
    })
    .injectImport({
      importName: effectsName,
      source: "./effects.tsx",
    })
    .injectFunctionBody(
      {
        stringTemplate: `return { state, callbacks }`,
      },
      { name: functionName }
    )
    .commit((cp) => {
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
      cp.finish();
    });
}
