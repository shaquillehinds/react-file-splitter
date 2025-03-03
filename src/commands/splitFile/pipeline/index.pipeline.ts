import { ReturnStatement } from "jscodeshift";
import { PatternKind } from "ast-types/gen/kinds";
import InjectionPipeline from "tscodeinject";

type IndexPipelineProps = {
  ip: InjectionPipeline;
  outputLocation: string;
  indexTemplate: string;
  params: PatternKind[];
  source: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
  stateLocation: string;
  callbacksLocation: string;
  returnStatement: ReturnStatement;
  controllerName: string;
};
export default async function indexPipeline({
  ip,
  indexTemplate,
  callbacksLocation,
  outputLocation,
  params,
  stateLocation,
  source,
  propertyNames,
  functionName,
  controllerName,
  returnStatement,
}: IndexPipelineProps) {
  await ip
    .parseString({
      outputLocation,
      text: indexTemplate,
    })
    .injectFunctionBody(
      {
        stringTemplate: `
const { state, callbacks } = ${controllerName}(props);
`,
      },
      { name: functionName }
    )
    .injectFunctionParams({ nodes: params }, { name: functionName })
    .injectImport({
      importName: `${functionName}Props`,
      source: "./controller/state.tsx",
    })
    .injectImport({
      importName: controllerName,
      source: "./controller/index.tsx",
    })
    .injectReturnStatement({ node: returnStatement }, { name: functionName })
    .injectImportsFromFile({ origin: { source, type: "source" } }, {})
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
