import jcs, { ReturnStatement } from "jscodeshift";
import { ExpressionKind } from "ast-types/gen/kinds";
import InjectorPipeline from "tscodeinject";
import statePipeline from "./state.pipeline.js";
import callbacksPipeline from "./callbacks.pipeline.js";
import effectsPipeline from "./effects.pipeline.js";
import controllerPipeline from "./controller.pipeline.js";
import indexPipeline from "./index.pipeline.js";

type SplitFilePipelineProps = {
  fileName: string;
  documentText: string;
  fileLocation: string;
  currDirectory: string;
};

export default async function splitFilePipeline(props: SplitFilePipelineProps) {
  const source = props.fileLocation;

  // const InjectorPipeline = (await import("tscodeinject")).default;

  const originalFilePipeline = new InjectorPipeline(source).parse();

  const defaultExportFinder = InjectorPipeline.getFinder("exportDefaultFinder");

  const originalFileCollection = originalFilePipeline._ast;

  if (!originalFileCollection) {
    console.log($lf(29), "Ast not loaded, file not found");
  } else {
    const originalDefExpCol = defaultExportFinder(
      jcs,
      originalFileCollection,
      {}
    ).col;

    const functionName = InjectorPipeline.getName(originalDefExpCol);

    const stateName = `${functionName}State`;
    const callbacksName = `${functionName}Callbacks`;
    const effectsName = `${functionName}Effects`;
    const controllerName = `${functionName}Controller`;

    const stateTemplate = `export default function ${stateName}(){}`;
    const callbacksTemplate = `export default function ${callbacksName}(){}`;
    const effectsTemplate = `export default function ${effectsName}(){}`;
    const controllerTemplate = `export default function ${controllerName}(){}`;
    const indexTemplate = `export default function ${functionName}(){}`;

    const newFilesDirecotry = `${props.currDirectory}/${props.fileName}`;
    const controllerDirectory = `${newFilesDirecotry}/controller`;

    const stateLocation = `${controllerDirectory}/state.tsx`;
    const callbacksLocation = `${controllerDirectory}/callbacks.tsx`;
    const effectsLocation = `${controllerDirectory}/effects.tsx`;
    const controllerLocation = `${controllerDirectory}/index.tsx`;
    const indexLocation = `${newFilesDirecotry}/index.tsx`;

    console.log($lf(59), newFilesDirecotry);

    if (functionName) {
      const functionFinder = InjectorPipeline.getFinder("functionFinder");
      const originalFuncCol = functionFinder(jcs, originalFileCollection, {
        name: functionName,
      }).col;

      const originalFuncBodyNodes =
        InjectorPipeline.getBodyNodes(originalFuncCol);

      const paramsAliases: jcs.TSTypeAliasDeclaration[] = [];
      const propertyNames: Record<string, string[]> = {};

      const params = InjectorPipeline.getFunctionParams(originalFuncCol).map(
        (p, i) => {
          const paramName = `props${i ? i : ""}`;
          const paramTypeName = `${functionName}Props${i ? i : ""}`;
          const transformed = InjectorPipeline.objParamToIdentifier({
            param: p,
            paramName,
            paramTypeName,
          });
          propertyNames[paramName] = [];
          transformed.propertyNames?.forEach((n) => {
            propertyNames[paramName].push(n);
          });
          transformed.typeAlias &&
            paramsAliases.push(
              //@ts-ignore
              jcs.exportNamedDeclaration(transformed.typeAlias)
            );
          return transformed.param;
        }
      );

      originalFilePipeline.injectDirectory(controllerDirectory);
      originalFilePipeline.finish();

      if (originalFuncBodyNodes) {
        const colGroups = InjectorPipeline.nodeGrouper({
          nodes: originalFuncBodyNodes,
          groups: [
            "VariableDeclaration",
            "ExpressionStatement",
            "FunctionDeclaration",
            "IfStatement",
            "TryStatement",
            "ReturnStatement",
          ],
          variableTypes: ["FunctionExpression", "ArrowFunctionExpression"],
          customVariableValidatorType: "CallExpression",
          customVariableValidator: (init: ExpressionKind) => {
            if (init.type === "CallExpression") {
              if (init.callee.type === "Identifier") {
                if (init.callee.name === "useCallback") return true;
              }
            }
            return false;
          },
        });

        const stateNodes = [
          ...colGroups.VariableDeclaration,
        ] as jcs.VariableDeclaration[];
        const effectNodes = [...colGroups.ExpressionStatement];
        const callbackNodes = [
          ...colGroups.FunctionDeclaration,
          ...colGroups.ArrowFunctionExpression,
          ...colGroups.FunctionExpression,
          ...colGroups.CallExpression,
        ] as (jcs.FunctionDeclaration | jcs.VariableDeclaration)[];
        const controllerNodes = [
          ...colGroups.IfStatement,
          ...colGroups.TryStatement,
        ];

        const ip = new InjectorPipeline("");

        await statePipeline({
          stateName,
          outputLocation: stateLocation,
          stateTemplate,
          source,
          paramsAliases,
          propertyNames,
          stateNodes,
          params,
          ip,
        });

        await callbacksPipeline({
          stateName,
          functionName,
          callbacksName,
          outputLocation: callbacksLocation,
          callbacksTemplate,
          stateLocation,
          source,
          propertyNames,
          callbackNodes,
          params,
          ip,
        });

        await effectsPipeline({
          stateName,
          functionName,
          effectsName,
          outputLocation: effectsLocation,
          stateLocation,
          callbacksName,
          callbacksLocation,
          effectsTemplate,
          effectNodes,
          source,
          propertyNames,
          params,
          ip,
        });

        await controllerPipeline({
          stateName,
          functionName,
          controllerName,
          outputLocation: controllerLocation,
          stateLocation,
          callbacksName,
          effectsName,
          callbacksLocation,
          controllerTemplate,
          controllerNodes,
          source,
          propertyNames,
          params,
          ip,
        });
        await indexPipeline({
          functionName,
          outputLocation: indexLocation,
          stateLocation,
          callbacksLocation,
          controllerName,
          indexTemplate,
          returnStatement: colGroups.ReturnStatement[0] as ReturnStatement,
          source,
          propertyNames,
          params,
          ip,
        });
      }
    }
  }
}

function $lf(n: number) {
  return "$lf|codeinject/src/experiment.ts:" + n + " >";
  // Automatically injected by Log Location Injector vscode extension
}
