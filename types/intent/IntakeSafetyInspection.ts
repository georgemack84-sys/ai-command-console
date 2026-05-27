export type IntakeSafetyInspection = {
  containsShellContent: boolean;
  containsScriptContent: boolean;
  containsBinaryData: boolean;
  containsRecursivePayload: boolean;
  exceedsLimits: boolean;
  malformedEncoding: boolean;
};
