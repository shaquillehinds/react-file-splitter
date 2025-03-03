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
  source: string;
  propertyNames: Record<string, string[]>;
  stateName: string;
};
export default async function statePipeline({
  ip,
  stateNodes,
  stateTemplate,
  outputLocation,
  params,
  paramsAliases,
  source,
  propertyNames,
  stateName,
}: StatePipelineProps) {
  await ip
    .parseString({
      text: stateTemplate,
      outputLocation: outputLocation,
    })
    .injectFunctionBody({ nodes: stateNodes }, { name: stateName })
    .injectFunctionParams({ nodes: params }, { name: stateName })
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
    .injectImportsFromFile({ origin: { source, type: "source" } }, {})
    .injectReturnAllFunctionVariables({}, { name: stateName })
    .injectStringTemplate({
      position: "lastLine",
      template: `export type ${stateName}Return = ReturnType <typeof ${stateName}>`,
    })
    .storeFileVariables()
    .finish();
}
