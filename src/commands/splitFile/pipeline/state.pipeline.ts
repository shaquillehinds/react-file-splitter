import { ASTNode, TSTypeAliasDeclaration } from "jscodeshift";
import InjectionPipeline from "tscodeinject";
import { PatternKind } from "ast-types/gen/kinds";

type StatePipelineProps = {
  ip: InjectionPipeline;
  stateTemplate: string;
  outputLocation: string;
  stateNodes: ASTNode[];
  params: PatternKind[];
  paramsAliases: TSTypeAliasDeclaration[];
  sourceFile: string;
  propertyNames: Record<string, string[]>;
  functionName: string;
};
export default async function statePipeline({
  ip,
  stateNodes,
  stateTemplate,
  outputLocation,
  params,
  paramsAliases,
  sourceFile,
  propertyNames,
  functionName,
}: StatePipelineProps) {
  console.log($lf(27), functionName);
  await ip
    .parseString({
      text: stateTemplate,
      outputLocation: outputLocation,
    })
    .injectFunctionBody({ nodes: stateNodes }, { name: functionName })
    .injectFunctionParams({ nodes: params }, { name: functionName })
    .injectToProgram(
      {
        nodes: paramsAliases,
        injectionPosition: "afterImport",
      },
      {}
    )
    .customInject((ip) => {
      for (const property of Object.keys(propertyNames)) {
        ip.injectObjectForAccessors({
          accessors: propertyNames[property],
          objectName: property,
        });
      }
    })
    .injectImportsFromFile(
      { origin: { source: sourceFile, type: "source" } },
      {}
    )
    .injectReturnAllFunctionVariables({}, { name: functionName })
    .injectStringTemplate({
      position: "lastLine",
      template: `export type ${functionName}Return = ReturnType <typeof ${functionName}>`,
    })
    .storeFileVariables()
    .finish();
}

function $lf(n: number) {
  return "$lf|splitFile/pipeline/state.pipeline.ts:" + n + " >";
  // Automatically injected by Log Location Injector vscode extension
}
