# Windows 安装指南

Storyforge 提供 Windows 桌面应用，可通过 Electron 打包为 `.exe` 安装程序。

---

## 方式一：下载预构建安装程序（推荐）

### 从 GitHub Releases 下载

1. 打开 [Storyforge Releases 页面](https://github.com/xtangxtang/storyforge-web/releases)
2. 下载最新版本的 `.exe` 安装文件（例如 `Storyforge Setup 1.0.0.exe`）
3. 双击安装文件，按提示完成安装

### 从 GitHub Actions 下载（开发版本）

如果你需要最新的开发版本（尚未发布 Release）：

1. 打开 [Storyforge Actions 页面](https://github.com/xtangxtang/storyforge-web/actions)
2. 点击 **"Build Windows Release"** 工作流
3. 选择一个最近的运行记录
4. 滚动到底部，点击 **"Storyforge-Setup"** 下载 `.exe` 文件

> **注意**：Actions 产物仅保留 90 天，请尽快下载安装。

---

## 方式二：手动从源码编译

适用于需要在本地修改代码或开发自定义功能的场景。

### 环境要求

| 项目 | 最低版本 |
|------|----------|
| Node.js | 18+ |
| npm | 9+ |
| Windows 10/11 | x64 |

### 步骤

#### 1. 克隆仓库

```bash
git clone https://github.com/xtangxtang/storyforge-web.git
cd storyforge-web
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 编译并构建

```bash
npm run electron:build
```

此命令会依次执行：
- `tsc -b` — TypeScript 编译检查
- `vite build` — 构建前端 Web 应用
- `vite build --config vite.electron.config.ts` — 构建 Electron 主进程
- `electron-builder --win` — 打包为 Windows 安装程序

#### 4. 获取安装文件

构建完成后，安装包位于：

```
release/Storyforge Setup x.x.x.exe
```

双击即可安装。

---

## 方式三：开发模式运行

如果只是想预览效果或调试，无需打包安装：

```bash
npm run electron:dev
```

这会启动 Electron 窗口，并自动加载 Vite 热更新。修改代码后窗口会自动刷新。

---

## 安装后使用

1. 首次打开，进入 **设置** 页面（点击底部导航栏的设置图标）
2. 输入 **DashScope LLM API Key**（用于 qwen3.6-plus 模型）
3. 输入 **DashScope 图视频 API Key**（用于 wan2.7 模型）
4. 保存后即可开始创建项目

> **企业代理用户**：如果公司网络需要代理，在设置页的 **HTTPS 代理** 字段填写代理地址（例如 `http://proxy.ims.intel.com:912`）。
