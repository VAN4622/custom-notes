-- Neon PostgreSQL 数据库建表语句
-- 便签墙配置表

-- 创建主表
CREATE TABLE IF NOT EXISTS note_walls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL DEFAULT '便签墙',
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    music_tracks JSONB NOT NULL DEFAULT '[]'::jsonb,
    colors JSONB NOT NULL DEFAULT '["#ffe0e3","#c7f0ff","#ffd8a8","#d9f2d9","#e5d7ff","#f9f7d9","#d2f0f8","#ffd4f5"]'::jsonb,
    settings JSONB NOT NULL DEFAULT '{
        "spawnSpeed": 50,
        "autoSpawn": true,
        "showAnimations": true,
        "maxCards": 180,
        "initialCardCount": 30
    }'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_note_walls_slug ON note_walls(slug);
CREATE INDEX IF NOT EXISTS idx_note_walls_expires_at ON note_walls(expires_at);
CREATE INDEX IF NOT EXISTS idx_note_walls_created_at ON note_walls(created_at DESC);

-- 创建自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_note_walls_updated_at ON note_walls;
CREATE TRIGGER update_note_walls_updated_at 
    BEFORE UPDATE ON note_walls
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据
INSERT INTO note_walls (slug, title, messages, music_tracks, expires_at) VALUES
(
    'demo',
    '示例便签墙',
    '["保持好心情", "多喝水哦", "今天辛苦啦", "早点休息", "记得吃水果", "加油，你可以的", "祝你顺利", "保持微笑呀"]'::jsonb,
    '[
        {
            "name": "Lofi Hip Hop",
            "artist": "Chill Beats",
            "src": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        },
        {
            "name": "Relaxing Piano",
            "artist": "Peaceful Music",
            "src": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        }
    ]'::jsonb,
    NOW() + INTERVAL '30 days'
)
ON CONFLICT (slug) DO NOTHING;

-- 查看表结构
-- \d note_walls

-- 查看所有数据
-- SELECT * FROM note_walls;
