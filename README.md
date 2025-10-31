# 便签墙项目 🎉

一个基于 Neon 数据库 + Vercel 无服务器函数的多用户便签墙系统，支持个性化配置和自定义访问链接。

## ✨ 功能特性

- 🎨 精美的便签墙界面，支持拖拽、最大化、最小化
- 🎵 内置音乐播放器，支持外链音乐
- ⚙️ 可自定义生成速度、动画效果等设置
- 🔗 每个用户独立的访问链接（如：`/demo`）
- 📅 支持设置页面过期时间
- 📱 完美适配移动端

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo>
cd note-wall
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 Neon 数据库

1. 访问 [neon.tech](https://neon.tech) 创建项目
2. 在 SQL Editor 中执行 `neon/schema.sql`
3. 复制数据库连接字符串

### 4. 配置环境变量

创建 `.env` 文件：

```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### 5. 本地开发

```bash
npm run dev
```

访问 `http://localhost:3000`

### 6. 部署到 Vercel

```bash
npm run deploy
```

或者通过 Vercel Dashboard 导入项目。

**重要：** 在 Vercel 项目设置中添加环境变量 `DATABASE_URL`

## 📁 项目结构

```
note-wall/
├── index.html              # 前端页面
├── style.css               # 样式文件
├── script.js               # JavaScript（支持动态加载）
├── api/
│   └── wall.js            # API 接口
├── neon/
│   ├── schema.sql         # 数据库表结构
│   ├── setup.js           # 自动初始化脚本
│   └── README.md          # Neon 配置指南
├── admin/
│   ├── create-wall.js     # 创建便签墙脚本
│   └── README.md          # 管理工具说明
├── package.json
├── vercel.json
├── DEPLOYMENT.md          # 部署指南
├── CHECKLIST.md           # 部署检查清单
└── README.md
```

## 🎯 使用方式

### 默认页面

访问：`https://your-domain.com/`
使用默认配置

### 自定义页面

1. 在数据库中创建记录：

```sql
INSERT INTO note_walls (slug, title, messages, music_tracks, expires_at) VALUES
(
    'my-wall',
    '我的便签墙',
    '["加油！", "保持微笑", "你最棒"]'::jsonb,
    '[{"name":"轻音乐","artist":"艺术家","src":"https://example.com/music.mp3"}]'::jsonb,
    NOW() + INTERVAL '7 days'
);
```

2. 访问：`https://your-domain.com/my-wall`

### 工作原理

- 访问根路径 `/` 时，使用默认配置
- 访问自定义路径（如 `/demo`）时，自动从 API 加载对应配置
- 如果找不到配置或已过期，会显示提示并使用默认配置

## 🛠️ 管理工具

### 使用脚本创建便签墙

```bash
export DATABASE_URL="your-connection-string"
node admin/create-wall.js
```

### 使用 SQL 管理

详见 `admin/README.md`

## 📊 数据库表结构

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| slug | text | URL 路径（唯一） |
| title | text | 页面标题 |
| messages | jsonb | 便签内容数组 |
| music_tracks | jsonb | 音乐列表 |
| colors | jsonb | 颜色配置 |
| settings | jsonb | 其他设置 |
| expires_at | timestamp | 过期时间 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

## 🔧 技术栈

- **前端**: 原生 HTML/CSS/JavaScript
- **数据库**: Neon (PostgreSQL)
- **后端**: Vercel Serverless Functions
- **部署**: Vercel

## 📝 API 文档

### GET /api/wall?slug={slug}

获取指定 slug 的便签墙配置

**响应示例：**

```json
{
  "success": true,
  "data": {
    "title": "我的便签墙",
    "messages": ["加油！", "保持微笑"],
    "musicTracks": [...],
    "colors": [...],
    "settings": {...},
    "expiresAt": "2024-12-01T00:00:00Z"
  }
}
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
