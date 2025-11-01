# 便签墙项目

一个基于 Neon 数据库 + Vercel 的多用户便签墙系统，支持个性化配置和自定义访问链接。

## 功能特性

- 精美的便签墙界面，支持拖拽、最大化、最小化
- 内置音乐播放器，支持外链音乐
- 可自定义生成速度、动画效果等设置
- 每个用户独立的访问链接
- 支持设置页面过期时间
- 图形化管理后台
- 完美适配移动端

## 快速开始

### 1. 配置 Neon 数据库

1. 访问 neon.tech 创建项目
2. 在 SQL Editor 中执行 database/schema.sql
3. 复制数据库连接字符串

### 2. 配置环境变量

在 Vercel 项目设置中添加：

```
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
ADMIN_PASSWORD=your-secure-password
```

### 3. 部署到 Vercel

```bash
git add .
git commit -m "Deploy note wall"
git push
```

或者通过 Vercel Dashboard 导入项目。

### 4. 访问

- 主页: https://your-domain.vercel.app/
- 管理后台: https://your-domain.vercel.app/admin

## 项目结构

```
note-wall/
├── index.html              # 主页
├── admin.html              # 管理后台
├── style.css               # 样式
├── script.js               # 主页逻辑
├── admin.js                # 管理后台逻辑
├── api/                    # API 接口
│   ├── wall.js            # 获取便签墙配置
│   └── admin/             # 管理后台 API
│       ├── auth.js        # 认证
│       ├── create-wall.js # 创建便签墙
│       ├── list-walls.js  # 列出便签墙
│       └── delete-wall.js # 删除便签墙
├── database/              # 数据库相关
│   ├── schema.sql         # 表结构
│   ├── setup.js           # 初始化脚本
│   └── README.md          # 数据库说明
├── scripts/               # 工具脚本
│   └── create-wall.js     # CLI 创建便签墙
├── package.json
├── vercel.json
└── README.md
```

## 使用方式

### 访问默认页面

访问根路径使用默认配置：
```
https://your-domain.vercel.app/
```

### 创建自定义便签墙

方法 1：使用管理后台（推荐）

1. 访问管理后台: https://your-domain.vercel.app/admin
2. 使用 ADMIN_PASSWORD 登录
3. 填写表单创建便签墙
4. 访问: https://your-domain.vercel.app/your-slug

方法 2：使用 SQL

在 Neon SQL Editor 中执行：

```sql
INSERT INTO note_walls (slug, title, messages, music_tracks, expires_at) VALUES
(
    'my-wall',
    '我的便签墙',
    '["加油", "保持微笑", "你最棒"]'::jsonb,
    '[{"name":"音乐","artist":"艺术家","src":"https://example.com/music.mp3"}]'::jsonb,
    NOW() + INTERVAL '7 days'
);
```

## 数据库表结构

note_walls 表字段：

- id: 主键 (UUID)
- slug: URL 路径，唯一
- title: 页面标题
- messages: 便签内容数组 (JSONB)
- music_tracks: 音乐列表 (JSONB)
- colors: 颜色配置 (JSONB)
- settings: 其他设置 (JSONB)
- expires_at: 过期时间
- created_at: 创建时间
- updated_at: 更新时间

## 技术栈

- 前端: HTML/CSS/JavaScript
- 数据库: Neon PostgreSQL
- 后端: Vercel Serverless Functions
- 部署: Vercel

## API 接口

### GET /api/wall?slug=demo

获取指定 slug 的便签墙配置

响应示例：
```json
{
  "success": true,
  "data": {
    "title": "示例便签墙",
    "messages": ["加油", "保持微笑"],
    "musicTracks": [...],
    "colors": [...],
    "settings": {...}
  }
}
```

### POST /api/admin/auth

管理员认证

请求：
```json
{
  "password": "your-password"
}
```

### POST /api/admin/create-wall

创建便签墙

请求：
```json
{
  "slug": "my-wall",
  "title": "我的便签墙",
  "messages": ["消息1", "消息2"],
  "musicTracks": [...],
  "expiresAt": "2024-12-31T00:00:00Z"
}
```

### GET /api/admin/list-walls

列出所有便签墙

### POST /api/admin/delete-wall

删除便签墙

请求：
```json
{
  "slug": "my-wall"
}
```

## 本地开发

```bash
# 安装依赖
npm install

# 创建 .env 文件
cp .env.example .env

# 编辑 .env 填入配置
# DATABASE_URL=...
# ADMIN_PASSWORD=...

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

## 常见问题

### 访问 /demo 显示 404

确保数据库中存在 slug 为 demo 的记录。

### 音乐无法播放

1. 确保音乐链接支持 CORS
2. 使用 HTTPS 链接
3. 浏览器可能阻止自动播放，点击"进入"按钮后会自动播放

### 管理后台无法登录

检查 Vercel 环境变量中是否正确设置了 ADMIN_PASSWORD。

### 首次访问较慢

Neon 免费版会自动休眠，首次访问需要几秒唤醒。

### 部署后静态文件 404

确保 vercel.json 配置正确，文件路径使用相对路径。

## 许可证

MIT License
