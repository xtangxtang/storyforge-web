# Android 安装与构建指南

Storyforge Android 版通过 Capacitor 6 将 Web 应用包装为原生 Android 应用（APK）。

---

## 方式一：下载预构建 APK（推荐）

### 从 GitHub Releases 下载

1. 打开 [Storyforge Releases 页面](https://github.com/xtangxtang/storyforge-web/releases)
2. 下载最新版本的 `.apk` 文件
3. 将 APK 文件传输到手机
4. 在手机文件管理器中点击 APK，允许安装未知来源应用后完成安装

### 从 GitHub Actions 下载（开发版本）

1. 打开 [Storyforge Actions 页面](https://github.com/xtangxtang/storyforge-web/actions)
2. 点击 **"Build Android Release"** 工作流
3. 选择一个最近的运行记录
4. 滚动到底部，点击 **"Storyforge-APK"** 下载 `.apk` 文件

> **注意**：Actions 产物仅保留 90 天，请尽快下载安装。

---

## 方式二：手动从源码编译 APK

适用于需要在本地修改代码或需要签名 APK 的场景。

### 环境要求

| 项目 | 最低版本 |
|------|----------|
| Node.js | 18+ |
| npm | 9+ |
| Android Studio | Ladybug (2024.2) 或更新 |
| JDK | 17+（通过 Android Studio 安装） |
| Android SDK | API 34+（通过 Android Studio SDK Manager 安装） |

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

#### 3. 构建 Web 前端

```bash
npm run build
```

#### 4. 同步到 Android 项目

```bash
npm run android:sync
```

这会将 `dist/` 目录中的 Web 文件复制到 `android/` 项目中。

#### 5. 用 Android Studio 打开

```bash
npm run android:open
```

Android Studio 会自动下载 Gradle 依赖。

#### 6. 构建 APK

在 Android Studio 中：
1. 等待 Gradle Sync 完成
2. 点击菜单 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. 等待构建完成
4. 点击底部弹出通知中的 **locate** 即可找到 APK 文件

APK 文件路径通常为：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 方式三：命令行直接构建（仅 APK）

如果你已经安装了 Android SDK 命令行工具，可以不用 Android Studio：

### 设置环境变量

```bash
# Linux / macOS
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH

# Windows (PowerShell)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin;$env:PATH"
```

### 构建命令

```bash
npm run build
npm run android:sync
cd android

# Linux / macOS
chmod +x gradlew
./gradlew assembleDebug

# Windows
gradlew.bat assembleDebug
```

APK 输出路径：

```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 安装 APK 到设备

### 通过 USB 安装

1. 手机开启 **开发者选项** 和 **USB 调试**
2. 通过 USB 连接电脑
3. 运行：

```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### 通过文件传输安装

1. 将 APK 文件复制到手机存储
2. 在手机文件管理器中找到 APK
3. 点击安装，允许"安装未知来源应用"

---

## 首次使用

1. 打开 Storyforge 应用
2. 进入 **设置**（底部导航栏的设置图标）
3. 输入 **DashScope LLM API Key**（用于 qwen3.6-plus）
4. 输入 **DashScope 图视频 API Key**（用于 wan2.7）
5. 保存后即可开始创建项目

> **企业代理用户**：如果需要代理，在设置页的 **HTTPS 代理** 字段填写代理地址（例如 `http://proxy.ims.intel.com:912`）。

---

## 常见问题

### APK 安装失败："解析包时出现问题"

- 检查 APK 文件是否完整下载
- 确保 Android 版本在 7.0（API 24）以上

### Gradle Sync 失败

- 检查 JDK 版本是否为 17 或更高（`java -version`）
- 在 Android Studio 中打开 **Settings** → **Build Tools** → **Gradle**，确认 Gradle JDK 设置为正确的版本

### 网络连接问题

- 在中国大陆构建时，npm 依赖可能需要代理
- 设置代理：`npm config set proxy http://proxy.ims.intel.com:912`
- Gradle 代理：在 `android/gradle.properties` 中添加：
  ```
  systemProp.https.proxyHost=proxy.ims.intel.com
  systemProp.https.proxyPort=912
  ```
