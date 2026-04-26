export interface AgentContext {
  projectId: string;
  data: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export abstract class Agent {
  abstract name: string;
  abstract run(context: AgentContext): Promise<AgentResult>;

  async review(_context: AgentContext, result: AgentResult): Promise<AgentResult> {
    return result.success ? result : this.retry(_context, result);
  }

  async retry(context: AgentContext, _result: AgentResult): Promise<AgentResult> {
    return this.run(context);
  }
}
