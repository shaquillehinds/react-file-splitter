// log-formatter signature
export const lfSig = "$lf(";
export const lf = "function $lf";
export const lfJS = lf + "(n) {";
export const lfTS = lf + "(n: number) {";
export const lfPrefix = "$lf|";
export const ignoreSig = "$lf-ignore";
export const injectSig = "$lf-inject";

export const rootConfig = "log-location-injector";

export const configs = {
  autoInject: "autoInject",
  locationDepth: "locationDepth",
  maxLocationDepth: "maxLocationDepth",
};
