// 管理脚本：创建新的便签墙
// 使用方法: node admin/create-wall.js

import { createClient } from '@supabase/supabase-js'
import * as readline from 'readline'

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
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('错误: 请设置 SUPABASE_URL 和 SUPABASE_SERVICE_KEY 环境变量')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // 收集信息
    const slug = await question('URL 路径 (slug): ')
    const title = await question('页面标题: ')
    const messagesInput = await question('便签内容 (用逗号分隔): ')
    const expiryDays = await question('过期天数 (留空表示永不过期): ')

    const messages = messagesInput.split(',').map(m => m.trim()).filter(Boolean)

    // 音乐配置
    const addMusic = await question('是否添加音乐? (y/n): ')
    let musicTracks = []

    if (addMusic.toLowerCase() === 'y') {
      let addMore = true
      while (addMore) {
        const name = await question('  音乐名称: ')
        const artist = await question('  艺术家: ')
        const src = await question('  音乐链接: ')
        
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
    }

    // 插入数据库
    const { data, error } = await supabase
      .from('note_walls')
      .insert({
        slug,
        title,
        messages,
        music_tracks: musicTracks,
        expires_at: expiresAt
      })
      .select()
      .single()

    if (error) {
      console.error('\n❌ 创建失败:', error.message)
      if (error.code === '23505') {
        console.error('提示: 该 slug 已存在，请使用其他名称')
      }
    } else {
      console.log('\n✅ 创建成功!')
      console.log('\n访问链接:')
      console.log(`  https://your-domain.com/${slug}`)
      console.log('\n配置信息:')
      console.log(JSON.stringify(data, null, 2))
    }

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
  } finally {
    rl.close()
  }
}

createWall()
