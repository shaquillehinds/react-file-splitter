import * as vscode from "vscode";
import { rootConfig } from "./constants";

export default function configToggle(configName: string) {
  const config = vscode.workspace.getConfiguration(rootConfig);
  const value = config.get<boolean>(configName);
  config.update(configName, !value, vscode.ConfigurationTarget.Global).then(
    () => {
      console.log(
        $lf(8),
        `${configName} has been turned ${!value ? "off" : "on"}!`
      );
    },
    (e) => console.error($lf(14), e)
  );
}
function $lf(n: number) {
  return "$lf|utils/configToggle.ts:" + n + " >";
}
