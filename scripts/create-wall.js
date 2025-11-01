// 管理脚本：创建新的便签墙
// 使用方法: node admin/create-wall.js

import { neon } from '@neondatabase/serverless'
import * as readline from 'readline'
import { config } from 'dotenv'

// 加载 .env 文件
config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createWall() {
  console.log('=== 创建新便签墙 ===\n')

  // 从环境变量读取配置
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ 错误: 请设置 DATABASE_URL 环境变量')
    console.error('示例: export DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"')
    process.exit(1)
  }

  try {
    // 创建 Neon 客户端
    const sql = neon(databaseUrl)

    // 收集信息
    const slug = await question('URL 路径 (slug): ')
    const title = await question('页面标题: ')
    const messagesInput = await question('便签内容 (用逗号分隔): ')
    const expiryDays = await question('过期天数 (留空表示永不过期): ')

    const messages = messagesInput.split(',').map(m => m.trim()).filter(Boolean)

    if (messages.length === 0) {
      console.error('❌ 错误: 至少需要一条便签内容')
      rl.close()
      return
    }

    // 音乐配置
    const addMusic = await question('是否添加音乐? (y/n): ')
    let musicTracks = []

    if (addMusic.toLowerCase() === 'y') {
      let addMore = true
      while (addMore) {
        const name = await question('  音乐名称: ')
        const artist = await question('  艺术家: ')
        const src = await question('  音乐链接 (HTTPS): ')
        
        musicTracks.push({ name, artist, src })
        
        const more = await question('  继续添加? (y/n): ')
        addMore = more.toLowerCase() === 'y'
      }
    }

    // 计算过期时间
    let expiresAt = null
    if (expiryDays && !isNaN(expiryDays)) {
      const days = parseInt(expiryDays)
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
      expiresAt = expiresAt.toISOString()
    }

    // 插入数据库
    console.log('\n正在创建...')
    
    const result = await sql`
      INSERT INTO note_walls (slug, title, messages, music_tracks, expires_at)
      VALUES (
        ${slug},
        ${title},
        ${JSON.stringify(messages)}::jsonb,
        ${JSON.stringify(musicTracks)}::jsonb,
        ${expiresAt}
      )
      RETURNING *
    `

    if (result && result.length > 0) {
      const data = result[0]
      console.log('\n✅ 创建成功!')
      console.log('\n访问链接:')
      console.log(`  https://notes.xihu.chat/${slug}`)
      console.log('\n配置信息:')
      console.log(`  ID: ${data.id}`)
      console.log(`  标题: ${data.title}`)
      console.log(`  便签数量: ${data.messages.length}`)
      console.log(`  音乐数量: ${data.music_tracks.length}`)
      console.log(`  过期时间: ${data.expires_at || '永不过期'}`)
      console.log(`  创建时间: ${data.created_at}`)
    } else {
      console.error('\n❌ 创建失败: 未返回数据')
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    if (error.message.includes('duplicate key')) {
      console.error('提示: 该 slug 已存在，请使用其他名称')
    }
  } finally {
    rl.close()
  }
}

createWall()
