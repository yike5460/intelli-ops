import { FunctionRegistry, RegisteredFunction } from './FunctionRegistry';
import { LargeLanguageModel } from './LargeLanguageModel';
import { ActionTypeDeterminer, FunctionType } from './ActionTypeDeterminer';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import { invokeModel } from '../../src/utils';

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  iterations: number;
}

export class ActionExecutor {
  private registry: FunctionRegistry;
  private client: BedrockRuntimeClient;
  private modelId: string;
  private actionTypeDeterminer: ActionTypeDeterminer;

  constructor(registry: FunctionRegistry, client: BedrockRuntimeClient, modelId: string) {
    this.registry = registry;
    this.client = client;
    this.modelId = modelId;
    this.actionTypeDeterminer = new ActionTypeDeterminer();
  }

  private mapActionTypeToFunctionType(actionType: number): FunctionType {
    switch (actionType) {
      case 0:
        return FunctionType.LLMOnly;
      case 1:
        return FunctionType.LLMWithRegisteredFunction;
      case 2:
        return FunctionType.LLMWithRegisteredFunctionAndCodebase;
      default:
        console.warn(`Unknown action type: ${actionType}. Defaulting to LLMOnly.`);
        return FunctionType.LLMOnly;
    }
  }
  async execute(intention: string, query: string, context: any): Promise<ExecutionResult> {
    const rawActionType = this.actionTypeDeterminer.determineActionType(intention);
    const actionType = this.mapActionTypeToFunctionType(rawActionType);
    const functions = this.registry.listFunctions(actionType);
    console.log("actionType:\n", actionType, "\nfunctions:\n", functions);

    if (functions.length === 0) {
      console.log("No functions found for action type:", actionType);
      return { success: false, error: "No suitable functions found for the given action type", iterations: 0 };
    }

    const functionSequence = await this.selectFunction(functions, query, context);
    console.log("functionSequence:\n", functionSequence);
    let result: any;
    let iterations = 0;
    const maxIterations = 3;

    do {
      try {
        result = await this.executeFunctionSequence(functionSequence, query, context);
        const evaluation = await this.evaluateOutput(result, query, context);
        
        if (evaluation.isSatisfactory) {
          return { success: true, result, iterations };
        } else if (iterations < maxIterations) {
          context = { ...context, previousResult: result, feedback: evaluation.feedback };
        } else {
          return { success: false, error: "Max iterations reached without satisfactory result", iterations };
        }
      } catch (error) {
        const errorHandler = await this.determineErrorHandling(error, query, context);
        if (errorHandler.retry && iterations < maxIterations) {
          context = { ...context, error, errorFeedback: errorHandler.feedback };
        } else {
          return { success: false, error: errorHandler.message, iterations };
        }
      }
      iterations++;
    } while (iterations < maxIterations);

    return { success: false, error: "Unexpected error", iterations };
  }

  private async selectFunction(functions: RegisteredFunction[], query: string, context: any): Promise<RegisteredFunction[]> {
    const prompt = `
Given the following query and context, determine the best sequence of functions to execute in order to solve the problem. First, use Chain of Thought reasoning to explain your decision-making process, then output the sequence of functions to execute, listed by their names.

Query: ${query}
Context: ${JSON.stringify(context)}

Available functions:
${functions.map(f => `- ${f.name}: ${f.description}`).join('\n')}

Think through the following steps:
1. Analyze the query and context to understand the problem.
2. Consider which functions are relevant to solving the problem.
3. Determine the optimal order of function execution.
4. Ensure that the output of each function is compatible with the input of the next function in the sequence.

Your reasoning:
[Your step-by-step reasoning goes here, do not include the output]

Based on the above reasoning, provide the optimal sequence of functions to execute, listed by their names, the output should be only the list of function names, each on a new line, no other text or output is allowed.
<output>
[First function name, Second function name, ...]
</output>
    `;
    const response = await invokeModel(this.client, this.modelId, prompt);
    console.log("raw model response to selectFunction:\n", response);
    const functionNames = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return functionNames.map(name => functions.find(f => f.name === name)).filter(f => f !== undefined) as RegisteredFunction[];
  }

  private async executeFunctionSequence(functionSequence: RegisteredFunction[], query: string, context: any): Promise<any> {
    let result = context;
    for (const func of functionSequence) {
      try {
        result = await this.executeFunction(func, query, result);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new Error(`Error executing function ${func.name}: ${error.message}`);
        } else {
          throw new Error(`Error executing function ${func.name}: Unknown error`);
        }
      }
    }
    return result;
  }

  private async executeFunction(func: RegisteredFunction, query: string, context: any): Promise<any> {
    return func.execute(query, context);
  }

  private async evaluateOutput(result: any, query: string, context: any): Promise<{ isSatisfactory: boolean, feedback?: string }> {
    return { isSatisfactory: true };
  }

  private async determineErrorHandling(error: any, query: string, context: any): Promise<{ retry: boolean, feedback?: string, message: string }> {
    return { retry: false, message: error.message || "An error occurred" };
  }
}
