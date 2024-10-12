import { LargeLanguageModel } from './LargeLanguageModel';
import { Inputs, Prompts } from './prompts';

export class IntentionClassifier {
  private llm: LargeLanguageModel;

  constructor(llm: LargeLanguageModel) {
    this.llm = llm;
  }

  async classify(query: string, context: any): Promise<string> {
    const inputs = new Inputs(context);
    const prompt = Prompts.renderIntentionClassificationPrompt(inputs);
    return this.llm.classify(prompt);
  }
}
