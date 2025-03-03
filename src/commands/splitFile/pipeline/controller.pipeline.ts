import { ASTNode } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type ControllerPipelineProps = {
  ip: InjectionPipeline;
  outputLocation: string;
  controllerTemplate: string;
  controllerNodes: ASTNode[];
  params: PatternKind[];
  source: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateLocation: string;
  stateName: string;
  callbacksLocation: string;
  callbacksName: string;
  effectsName: string;
  controllerName: string;
};
export default async function controllerPipeline({
  ip,
  effectsName,
  controllerTemplate,
  controllerNodes,
  callbacksName,
  callbacksLocation,
  outputLocation,
  params,
  stateName,
  stateLocation,
  source,
  propertyNames,
  functionName,
  controllerName,
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
      { name: controllerName }
    )
    .injectFunctionBody({ nodes: controllerNodes }, { name: controllerName })
    .injectImportsFromFile({ origin: { source, type: "source" } }, {})
    .injectFunctionParams({ nodes: params }, { name: controllerName })
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
      { name: controllerName }
    )
    .commit((cp) => {
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
      cp.finish();
    });
}
