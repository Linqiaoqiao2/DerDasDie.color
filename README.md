# DerDieDas Color Reader

德语词性色彩映射阅读器 - German Gender Color-Reader

## 功能特性

- 🎨 **自动词性识别**：使用 DeepSeek API 自动识别德语文本中的名词及其词性
- 🌈 **色彩映射**：根据词性自动着色（der=蓝色, die=红色, das=绿色, 复数=琥珀色）
- 📖 **变格表**：点击着色单词查看四个格的变格表（Nominativ/Genitiv/Dativ/Akkusativ）
- ⭐ **生词本**：收藏单词到本地存储，方便复习
- ✨ **流畅动画**：使用 Framer Motion 提供平滑的交互体验

## 技术栈

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: DeepSeek API (via OpenAI SDK)
- **Icons**: Lucide React
- **Animation**: Framer Motion

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并添加你的 DeepSeek API Key：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 使用说明

1. 在文本框中输入或粘贴德语文本
2. 点击"分析文本"按钮
3. 查看着色后的文本，名词会根据词性显示不同颜色
4. 点击着色单词查看变格表
5. 点击星标收藏单词到生词本

## 项目结构

```
.
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts      # DeepSeek API 路由
│   ├── components/
│   │   └── ReadingMode.tsx   # 阅读模式组件
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 主页面
│   └── types.ts              # TypeScript 类型定义
├── package.json
├── tailwind.config.ts        # Tailwind 配置
└── tsconfig.json
```

## 注意事项

- 需要有效的 DeepSeek API Key
- 变格表功能目前使用简化规则，实际德语变格更复杂
- 生词本数据存储在浏览器 localStorage 中

## License

MIT

