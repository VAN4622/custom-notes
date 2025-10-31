// Neon 数据库初始化脚本
// 使用方法: node neon/setup.js

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupDatabase() {
  console.log('🚀 开始初始化 Neon 数据库...\n')

  // 从环境变量获取连接字符串
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ 错误: 请设置 DATABASE_URL 环境变量')
    console.error('示例: export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"')
    process.exit(1)
  }

  try {
    // 创建 Neon 客户端
    const sql = neon(databaseUrl)

    // 读取 SQL 文件
    const schemaPath = join(__dirname, 'schema.sql')
    const schema = readFileSync(schemaPath, 'utf-8')

    console.log('📝 执行建表语句...')

    // 执行 SQL（分割成多个语句）
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.includes('CREATE TABLE') || 
          statement.includes('CREATE INDEX') || 
          statement.includes('CREATE TRIGGER') ||
          statement.includes('CREATE OR REPLACE FUNCTION') ||
          statement.includes('INSERT INTO')) {
        try {
          await sql(statement)
          console.log('✅', statement.split('\n')[0].substring(0, 60) + '...')
        } catch (err) {
          // 忽略已存在的错误
          if (!err.message.includes('already exists')) {
            throw err
          }
          console.log('⚠️ ', statement.split('\n')[0].substring(0, 60) + '... (已存在)')
        }
      }
    }

    console.log('\n🎉 数据库初始化完成！')
    console.log('\n📊 验证数据...')

    // 验证表是否创建成功
    const result = await sql`
      SELECT slug, title, created_at 
      FROM note_walls 
      ORDER BY created_at DESC
    `

    console.log(`\n✅ 找到 ${result.length} 条记录:`)
    result.forEach(row => {
      console.log(`  - ${row.slug}: ${row.title}`)
    })

    console.log('\n✨ 全部完成！')

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    process.exit(1)
  }
}

setupDatabase()
