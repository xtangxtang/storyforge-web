import { v4 as uuidv4 } from 'uuid';
import { chatCompletion, type ChatMessage } from '../api/llmService';
import { Agent, AgentContext, AgentResult } from './agent';

// ── System Prompts ──

const BRIEF_PROMPT = `你是专业的影视策划人。根据用户的创意描述，生成一个短剧项目的 Brief。

要求输出严格的 JSON 格式，不要任何多余的文字：
{
  "genre": "类型（romance/thriller/sci-fi/daily/comedy）",
  "duration": 目标时长（秒，30-120之间）,
  "aspect_ratio": "画面比例（9:16 或 16:9）",
  "mood": "情绪基调",
  "visual_style": "视觉风格描述（英文，用于图像/视频生成）",
  "story_outline": "故事大纲（200字以内，中文）"
}

默认：竖屏 9:16，时长 60-90 秒，面向手机短视频。`;

const SCRIPT_PROMPT = `你是专业影视编剧。根据创意编写短剧剧本，必须输出严格 JSON 格式，不要任何多余文字。

JSON 结构必须完全匹配：
{
  "scenes": [
    {
      "scene_num": 1,
      "location": "场景英文名",
      "description": "场景描述（中文）",
      "action": "角色动作（中文）",
      "dialogue": ["台词1", "台词2"],
      "duration": 15
    }
  ],
  "assets": [
    {"type": "character", "name": "角色英文名", "description": "Detailed English visual description for AI image generation"},
    {"type": "location", "name": "场景英文名", "description": "Detailed English visual description for AI image generation"}
  ]
}

要求：
- 2-5 个场景，总时长匹配目标时长
- 每个场景必须有 scene_num, location, description, action, dialogue, duration
- 提取所有角色(character)和场景(location)作为 assets
- 所有 description 必须用英文，详细用于 AI 图像生成
- dialogue 可以是空数组`;

const STORYBOARD_PROMPT = `你是专业分镜师。根据剧本制作分镜脚本，必须输出严格 JSON 格式，不要任何多余文字。

JSON 结构必须完全匹配：
{
  "storyboards": [
    {
      "scene_num": 1,
      "shot_num": 1,
      "shot_type": "close-up",
      "camera_move": "static",
      "description": "分镜画面描述（中文）",
      "first_frame_prompt": "首帧图生成提示词（中文，详细描述画面内容、光影、色调、构图）",
      "video_prompt": "视频生成提示词（中文，描述运镜方式、角色动作、环境变化）",
      "duration": 8
    }
  ]
}

要求：
- 每个场景拆成 1-3 个镜头
- shot_type 用: close-up/medium/wide/extreme-close-up
- camera_move 用: static/pan/zoom/tilt/dolly
- first_frame_prompt 和 video_prompt 必须用中文，详细描述用于 wan2.7 模型
- first_frame_prompt 侧重画面内容：光影、色调、构图、角色位置
- video_prompt 侧重动态：运镜、角色动作、环境变化
- 总时长与剧本一致`;

// ── Agents ──

export class PlanningAgent extends Agent {
  name = 'PlanningAgent';

  async run(context: AgentContext): Promise<AgentResult> {
    const prompt = context.data.prompt as string;
    if (!prompt) return { success: false, error: 'No prompt provided' };

    const messages: ChatMessage[] = [
      { role: 'system', content: BRIEF_PROMPT },
      { role: 'user', content: `请为以下创意生成 Brief：${prompt}` },
    ];

    try {
      const res = await chatCompletion(messages, { jsonMode: true, temperature: 0.8 });
      const brief = JSON.parse(res.content);

      if (!brief.genre || !brief.duration || !brief.story_outline) {
        return { success: false, error: 'Invalid brief format' };
      }

      return {
        success: true,
        data: {
          genre: brief.genre,
          duration: Math.min(120, Math.max(30, Number(brief.duration) || 60)),
          aspectRatio: brief.aspect_ratio || '9:16',
          mood: brief.mood || 'neutral',
          visualStyle: brief.visual_style || '',
          storyOutline: brief.story_outline,
        },
      };
    } catch (e) {
      return { success: false, error: `Planning failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
}

export class ScriptAgent extends Agent {
  name = 'ScriptAgent';

  async run(context: AgentContext): Promise<AgentResult> {
    const prompt = context.data.prompt as string;
    const brief = context.data.brief as Record<string, unknown> | undefined;
    const feedback = context.data.feedback as string | undefined;

    const briefText = brief
      ? `Brief: genre=${brief.genre}, mood=${brief.mood}, story=${brief.story_outline}`
      : '';
    const feedbackText = feedback ? `\n修改建议：${feedback}` : '';

    const messages: ChatMessage[] = [
      { role: 'system', content: SCRIPT_PROMPT },
      { role: 'user', content: `根据以下创意编写剧本：${prompt}\n${briefText}${feedbackText}` },
    ];

    try {
      const res = await chatCompletion(messages, { jsonMode: true, temperature: 0.8 });
      const result = JSON.parse(res.content);

      if (!result.scenes || !Array.isArray(result.scenes)) {
        return { success: false, error: 'Invalid script format' };
      }

      const assets = (result.assets || []).map((a: Record<string, string>) => ({
        id: `asset_${uuidv4().slice(0, 8)}`,
        projectId: context.projectId,
        type: a.type || 'character',
        name: a.name || '',
        description: a.description || '',
        prompt: a.description || '',
        state: 'pending',
        createdAt: Date.now(),
      }));

      return {
        success: true,
        data: { scenes: result.scenes, assets, raw: result },
      };
    } catch (e) {
      return { success: false, error: `Script failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
}

export class ProductionAgent extends Agent {
  name = 'ProductionAgent';

  async run(context: AgentContext): Promise<AgentResult> {
    const script = context.data.script as Record<string, unknown> | undefined;
    const brief = context.data.brief as Record<string, unknown> | undefined;
    const feedback = context.data.feedback as string | undefined;

    const scriptText = script ? `Script: ${JSON.stringify(script)}` : '';
    const briefText = brief ? `Brief: mood=${brief.mood}` : '';
    const feedbackText = feedback ? `\n修改建议：${feedback}` : '';

    const messages: ChatMessage[] = [
      { role: 'system', content: STORYBOARD_PROMPT },
      { role: 'user', content: `根据以下剧本和策划生成分镜：\n${scriptText}\n${briefText}${feedbackText}` },
    ];

    try {
      const res = await chatCompletion(messages, { jsonMode: true, temperature: 0.7 });
      const result = JSON.parse(res.content);

      if (!result.storyboards || !Array.isArray(result.storyboards)) {
        return { success: false, error: 'Invalid storyboard format' };
      }

      const storyboards = result.storyboards.map((sb: Record<string, unknown>) => ({
        id: `shot_${uuidv4().slice(0, 8)}`,
        projectId: context.projectId,
        sceneNum: (sb.scene_num as number) || 0,
        shotNum: (sb.shot_num as number) || 0,
        shotType: (sb.shot_type as string) || 'medium',
        cameraMove: (sb.camera_move as string) || 'static',
        description: (sb.description as string) || '',
        firstFramePrompt: (sb.first_frame_prompt as string) || '',
        videoPrompt: (sb.video_prompt as string) || '',
        duration: (sb.duration as number) || 5,
        state: 'pending',
        createdAt: Date.now(),
      }));

      return { success: true, data: { storyboards } };
    } catch (e) {
      return { success: false, error: `Storyboard failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }
}
