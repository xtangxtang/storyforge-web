# Storyforge Web

> AI 驱动的短视频制作工具 — Web 版（Electron / Android）

## 安装与部署

### Web 开发（浏览器）

```bash
npm install
npm run dev
# 浏览器打开 http://localhost:5173
```

### Windows 桌面版（Electron）

```bash
# 开发模式（自动热重载）
npm run electron:dev

# 构建安装包（需要 Windows 环境）
npm run electron:build
# 输出：release/Storyforge Setup x.x.x.exe
```

> 详见 [doc/windows-install.md](doc/windows-install.md) — 包括从 GitHub Releases/Actions 下载预构建安装程序的方法。

### Android 版

```bash
# 构建 Web 前端并同步到 Android 项目
npm run build && npm run android:sync

# 用 Android Studio 打开并构建 APK
npm run android:open
```

> 详见 [doc/android-install.md](doc/android-install.md) — 包括下载预构建 APK 和命令行构建的方法。

## 技术栈

- **框架**：React 18 + TypeScript
- **构建工具**：Vite 6
- **状态管理**：Zustand
- **路由**：React Router 6
- **Windows 打包**：Electron + electron-builder
- **Android 打包**：Capacitor 6
- **HTTP**：Axios

## 项目结构

```
storyforge-web/
├── src/
│   ├── main.tsx                # React 入口
│   ├── App.tsx                 # 路由布局
│   ├── api/
│   │   ├── llmService.ts       # LLM 调用（qwen3.6-plus）
│   │   └── dashscopeService.ts # 图/视频生成（wan2.7）
│   ├── core/
│   │   ├── agent.ts            # Agent 基类
│   │   ├── agents.ts           # Planning / Script / Production Agent
│   │   └── directorAgent.ts    # DirectorAgent + LLM 审阅环
│   ├── store/
│   │   ├── configStore.ts      # API Key 配置（localStorage）
│   │   └── projectStore.ts     # 项目数据（localStorage）
│   ├── types/                  # TypeScript 类型
│   ├── pages/                  # 页面组件
│   │   ├── ProjectListPage.tsx
│   │   ├── CreateProjectPage.tsx
│   │   ├── ProjectDetailPage.tsx
│   │   └── SettingsPage.tsx
│   └── components/             # 可复用组件
├── electron/
│   ├── main.ts                 # Electron 主进程
│   └── preload.ts              # 预加载脚本
├── index.html
├── package.json
├── vite.config.ts
├── vite.electron.config.ts
├── electron-builder.json
└── capacitor.config.ts
```

## 工作原理

```
输入创意 → 策划(PlanningAgent) → 编剧(ScriptAgent) → 分镜(ProductionAgent) → 生成视频
                    ↓                    ↓                      ↓
              DirectorAgent LLM 审阅环（质量评分，不合格则打回重做）
```

所有数据保存在浏览器 localStorage 中，API Key 也仅保存在本地。
