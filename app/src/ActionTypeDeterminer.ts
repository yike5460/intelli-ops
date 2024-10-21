export enum FunctionType {
  LLMOnly,
  LLMWithRegisteredFunction,
  LLMWithRegisteredFunctionAndCodebase
}

export class ActionTypeDeterminer {

  /*
  | Intention Category | Action |
  |--------------------|--------|
  | Code review and analysis | LLMWithRegisteredFunctionAndCodebase |
  | Repository management | LLMWithRegisteredFunction |
  | Documentation tasks | LLM Only |
  | GitHub Actions and CI/CD operations | LLMWithRegisteredFunction |
  | Other (general query) | LLM only |
  */
  determineActionType(intention: string): FunctionType {
    if (intention.includes('Code review and analysis')) {
      console.log("intention:", intention, "branch code review and analysis");
      return FunctionType.LLMWithRegisteredFunctionAndCodebase;
    } else if (intention.includes('Repository management')) {
      console.log("intention:", intention, "branch repository management");
      return FunctionType.LLMWithRegisteredFunction;
    } else if (intention.includes('Documentation tasks')) {
      console.log("intention:", intention, "branch documentation tasks");
      return FunctionType.LLMOnly;
    } else if (intention.includes('GitHub Actions and CI/CD operations')) {
      console.log("intention:", intention, "branch github actions and ci/cd operations");
      return FunctionType.LLMWithRegisteredFunction;
    } else {
      console.log("intention:", intention, "branch general query");
      return FunctionType.LLMOnly;
    }
  }
}
