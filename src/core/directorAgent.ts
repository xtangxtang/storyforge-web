import { chatCompletion, type ChatMessage } from '../api/llmService';
import type { AgentContext, AgentResult } from './agent';
import { PlanningAgent, ScriptAgent, ProductionAgent } from './agents';

const STAGE_ORDER = [
  'planning', 'scripting', 'asseting',
  'storyboarding', 'generating', 'cutting', 'done',
] as const;

const REVIEW_PROMPTS: Record<string, string> = {
  brief: `请审阅以下短剧策划 Brief，给出质量评估。
评分维度：内容完整性、逻辑一致性、可执行性
Brief 内容：
{content}
输出严格 JSON：{"score": 1-10, "pass": true/false, "feedback": "修改建议（中文）"}`,

  script: `请审阅以下短剧剧本，给出质量评估。
评分维度：场景完整性、字段齐全、assets 提取、时长合理
剧本内容：
{content}
输出严格 JSON：{"score": 1-10, "pass": true/false, "feedback": "修改建议（中文）"}`,

  storyboard: `请审阅以下分镜脚本，给出质量评估。
评分维度：覆盖所有场景、prompt 详细度、动态描述
分镜内容：
{content}
输出严格 JSON：{"score": 1-10, "pass": true/false, "feedback": "修改建议（中文）"}`,
};

export class DirectorAgent {
  private planningAgent = new PlanningAgent();
  private scriptAgent = new ScriptAgent();
  private productionAgent = new ProductionAgent();

  static readonly MAX_RETRIES = 3;

  async runPlanning(ctx: AgentContext): Promise<AgentResult> {
    return this.runStageWithReview(ctx, this.planningAgent, 'brief');
  }

  async runScripting(ctx: AgentContext): Promise<AgentResult> {
    return this.runStageWithReview(ctx, this.scriptAgent, 'script');
  }

  async runStoryboarding(ctx: AgentContext): Promise<AgentResult> {
    return this.runStageWithReview(ctx, this.productionAgent, 'storyboard');
  }

  private async runStageWithReview(
    ctx: AgentContext,
    agent: { run: (c: AgentContext) => Promise<AgentResult> },
    reviewType: string,
  ): Promise<AgentResult> {
    let lastResult: AgentResult | null = null;

    for (let attempt = 0; attempt <= DirectorAgent.MAX_RETRIES; attempt++) {
      if (attempt > 0 && lastResult?.data?.feedback) {
        ctx.data.feedback = lastResult.data.feedback;
      }

      lastResult = await agent.run(ctx);
      if (!lastResult.success) return lastResult;

      const reviewResult = await this._review(reviewType, lastResult.data);
      const reviewData = reviewResult.data;

      if (reviewData) {
        const passed = reviewData.pass as boolean | undefined;
        const score = reviewData.score as number | undefined;
        const feedback = reviewData.feedback as string | undefined;

        if (passed) {
          return {
            success: true,
            data: {
              ...lastResult.data,
              reviewScore: score,
              nextStage: this._getNextStage(ctx),
            },
          };
        }

        if (attempt >= DirectorAgent.MAX_RETRIES) {
          return {
            success: true,
            data: {
              ...lastResult.data,
              reviewScore: score,
              reviewFeedback: `审阅未通过（${DirectorAgent.MAX_RETRIES}次重试仍失败）：${feedback}`,
              nextStage: this._getNextStage(ctx),
            },
          };
        }
      }
    }

    return lastResult || { success: false, error: 'Unknown error' };
  }

  private async _review(type: string, content: Record<string, unknown> | undefined): Promise<AgentResult> {
    const template = REVIEW_PROMPTS[type];
    if (!template) return { success: true, data: { pass: true, score: 5 } };

    const prompt = template.replace('{content}', content ? JSON.stringify(content) : '');
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt },
    ];

    try {
      const res = await chatCompletion(messages, { jsonMode: true, temperature: 0.3 });
      return { success: true, data: JSON.parse(res.content) };
    } catch {
      return { success: true, data: { pass: true, score: 5 } };
    }
  }

  private _getNextStage(ctx: AgentContext): string {
    const current = ctx.data.currentStage as string;
    const idx = STAGE_ORDER.indexOf(current as typeof STAGE_ORDER[number]);
    return idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : 'done';
  }
}
