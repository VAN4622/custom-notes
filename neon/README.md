# Neon 数据库配置指南

## 1. 创建 Neon 项目

1. 访问 [neon.tech](https://neon.tech)
2. 注册/登录账号
3. 创建新项目
4. 选择区域（建议选择离用户最近的）
5. 记录连接信息

## 2. 获取连接字符串

在 Neon Dashboard 中，你会看到类似这样的连接字符串：

```
postgresql://[user]:[password]@[host]/[database]?sslmode=require
```

示例：
```
postgresql://myuser:mypassword@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## 3. 执行建表语句

### 方法 1: 使用 Neon SQL Editor（推荐）

1. 在 Neon Dashboard 中点击 "SQL Editor"
2. 复制 `neon/schema.sql` 的内容
3. 粘贴并执行
4. 确认表创建成功

### 方法 2: 使用 psql 命令行

```bash
# 安装 PostgreSQL 客户端（如果还没有）
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client
# Windows: 下载 PostgreSQL 安装包

# 连接到 Neon 数据库
psql "postgresql://[user]:[password]@[host]/[database]?sslmode=require"

# 执行 SQL 文件
\i neon/schema.sql

# 或者直接执行
psql "postgresql://..." < neon/schema.sql
```

### 方法 3: 使用 Node.js 脚本

```bash
node neon/setup.js
```

## 4. 配置环境变量

### 4.1 本地开发 (.env)

```env
# Neon 数据库连接
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# 或者分开配置
NEON_HOST=ep-cool-darkness-123456.us-east-2.aws.neon.tech
NEON_DATABASE=neondb
NEON_USER=myuser
NEON_PASSWORD=mypassword
```

### 4.2 Vercel 部署

在 Vercel 项目设置中添加环境变量：
- `DATABASE_URL`: 你的 Neon 连接字符串

## 5. 更新 API 代码

API 代码需要从 Supabase 客户端改为使用 PostgreSQL 客户端。

参考 `api/wall-neon.js` 文件。

## 6. 验证数据库

```sql
-- 查看表结构
\d note_walls

-- 查看所有数据
SELECT slug, title, created_at, expires_at FROM note_walls;

-- 测试查询
SELECT * FROM note_walls WHERE slug = 'demo';
```

## 7. 常用操作

### 创建新便签墙
```sql
INSERT INTO note_walls (slug, title, messages, music_tracks, expires_at) VALUES
(
    'my-wall',
    '我的便签墙',
    '["加油！", "保持微笑"]'::jsonb,
    '[{"name":"音乐","artist":"艺术家","src":"https://..."}]'::jsonb,
    NOW() + INTERVAL '7 days'
);
```

### 更新便签墙
```sql
UPDATE note_walls
SET messages = '["新消息1", "新消息2"]'::jsonb
WHERE slug = 'my-wall';
```

### 延长过期时间
```sql
UPDATE note_walls
SET expires_at = NOW() + INTERVAL '30 days'
WHERE slug = 'my-wall';
```

### 删除过期数据
```sql
DELETE FROM note_walls WHERE expires_at < NOW();
```

## 8. Neon 特性

### 自动休眠
- Neon 免费版会在不活动时自动休眠
- 首次查询可能需要几秒钟唤醒
- 付费版可以禁用自动休眠

### 分支功能
- Neon 支持数据库分支（类似 Git）
- 可以为开发/测试创建独立分支

### 连接池
- 建议使用连接池以提高性能
- 参考 `api/wall-neon.js` 中的配置

## 9. 性能优化

### 使用连接池
```javascript
import { Pool } from '@neondatabase/serverless'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
```

### 启用预备语句
```javascript
const result = await pool.query(
  'SELECT * FROM note_walls WHERE slug = $1',
  [slug]
)
```

## 10. 监控和日志

在 Neon Dashboard 中可以查看：
- 查询性能
- 连接数
- 存储使用情况
- 慢查询日志

## 11. 备份

Neon 自动备份，但建议定期导出：

```bash
pg_dump "postgresql://..." > backup.sql
```

## 12. 迁移到生产环境

1. 在 Neon 创建生产数据库
2. 执行 schema.sql
3. 迁移数据（如果有）
4. 更新 Vercel 环境变量
5. 测试 API 连接
6. 部署
