import axios from 'axios';
import { useConfigStore } from '../store/configStore';

const DASHSCOPE_BASE = 'https://dashscope.aliyuncs.com';

async function getApiKey(): Promise<string> {
  const key = useConfigStore.getState().dashscopeApiKey;
  if (!key) throw new Error('DashScope API Key 未配置，请前往设置页面配置');
  return key;
}

/**
 * Generate image via wan2.7-image model
 * Prompt should be in Chinese for best results
 */
export async function generateImage(prompt: string): Promise<string> {
  const apiKey = await getApiKey();

  const response = await axios.post(
    `${DASHSCOPE_BASE}/api/v1/services/aigc/multimodal-generation/generation`,
    {
      model: 'wan2.7-image',
      input: {
        messages: [{ role: 'user', content: [{ text: prompt }] }],
      },
      parameters: { size: '1024*1024', n: 1 },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      timeout: 60000,
    },
  );

  const data = response.data;
  const taskId = data.output?.task_id;

  if (taskId) {
    return pollImageTask(taskId);
  }

  // Sync response
  const choices = data.output?.choices;
  if (choices?.length > 0) {
    const content = choices[0].message?.content;
    if (content?.length > 0) return content[0].image;
  }

  throw new Error('No image URL in response');
}

async function pollImageTask(taskId: string): Promise<string> {
  const apiKey = await getApiKey();

  for (let i = 0; i < 120; i++) {
    await sleep(5000);

    const response = await axios.get(
      `${DASHSCOPE_BASE}/api/v1/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      },
    );

    const status = response.data.output?.task_status;
    if (status === 'SUCCEEDED') {
      const results = response.data.output?.results;
      if (results?.length > 0) return results[0].url;
      const choices = response.data.output?.choices;
      if (choices?.length > 0) {
        const content = choices[0].message?.content;
        if (content?.length > 0) return content[0].image;
      }
      throw new Error('No image URL in task result');
    }
    if (status === 'FAILED') {
      throw new Error(`Image generation failed: ${response.data.output?.message || 'unknown'}`);
    }
  }

  throw new Error('Image generation timeout');
}

/**
 * Generate video via wan2.7-i2v (image-to-video)
 */
export async function generateVideo(options: {
  prompt: string;
  firstFrameUrl: string;
  duration?: number;
}): Promise<string> {
  const apiKey = await getApiKey();

  const response = await axios.post(
    `${DASHSCOPE_BASE}/api/v1/services/aigc/video-generation/video-synthesis`,
    {
      model: 'wan2.7-i2v',
      input: {
        prompt: options.prompt,
        media_url: options.firstFrameUrl,
      },
      parameters: {
        resolution: '720P',
        duration: options.duration ?? 5,
        prompt_extend: true,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-DashScope-Async': 'enable',
      },
      timeout: 60000,
    },
  );

  const taskId = response.data.output?.task_id;
  if (!taskId) throw new Error('No task_id returned');

  return pollVideoTask(taskId);
}

async function pollVideoTask(taskId: string): Promise<string> {
  const apiKey = await getApiKey();

  for (let i = 0; i < 120; i++) {
    await sleep(5000);

    const response = await axios.get(
      `${DASHSCOPE_BASE}/api/v1/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      },
    );

    const status = response.data.output?.task_status;
    if (status === 'SUCCEEDED') {
      const videoUrl = response.data.output?.video_url;
      if (videoUrl) return videoUrl;
      const results = response.data.output?.results;
      if (results?.length > 0) return results[0].url;
      throw new Error('No video URL in task result');
    }
    if (status === 'FAILED') {
      throw new Error(`Video generation failed: ${response.data.output?.message || 'unknown'}`);
    }
  }

  throw new Error('Video generation timeout (10 min)');
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
