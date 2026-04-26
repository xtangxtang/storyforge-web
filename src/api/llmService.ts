import axios from 'axios';
import { useConfigStore } from '../store/configStore';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmResponse {
  content: string;
  usage?: Record<string, number>;
}

const LLM_BASE_URL = 'https://coding.dashscope.aliyuncs.com/compatible-mode/v1';

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { model?: string; temperature?: number; jsonMode?: boolean },
): Promise<LlmResponse> {
  const apiKey = useConfigStore.getState().llmApiKey;
  if (!apiKey) throw new Error('LLM API Key 未配置，请前往设置页面配置');

  const model = options?.model || 'qwen3.6-plus';
  let processedMessages = [...messages];

  if (options?.jsonMode) {
    const systemIdx = processedMessages.findIndex(m => m.role === 'system');
    if (systemIdx >= 0) {
      if (!processedMessages[systemIdx].content.toLowerCase().includes('json')) {
        processedMessages[systemIdx] = {
          ...processedMessages[systemIdx],
          content: processedMessages[systemIdx].content + '\n\n必须返回严格的 JSON 格式。',
        };
      }
    } else {
      processedMessages = [
        { role: 'system', content: '返回严格的 JSON 格式。' },
        ...processedMessages,
      ];
    }
  }

  const response = await axios.post(
    `${LLM_BASE_URL}/chat/completions`,
    {
      model,
      messages: processedMessages,
      temperature: options?.temperature ?? 0.7,
      ...(options?.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 120000,
    },
  );

  const choice = response.data.choices?.[0];
  return {
    content: choice?.message?.content || '',
    usage: response.data.usage,
  };
}
