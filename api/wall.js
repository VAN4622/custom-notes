// Vercel Serverless Function - Neon 版本
// 路径: /api/wall?slug=custom

import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    const { slug } = req.query

    if (!slug) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing slug parameter' 
      })
    }

    // 初始化 Neon 客户端
    const sql = neon(process.env.DATABASE_URL)

    // 查询数据库（使用参数化查询防止 SQL 注入）
    const result = await sql`
      SELECT * FROM note_walls 
      WHERE slug = ${slug}
      LIMIT 1
    `

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wall not found' 
      })
    }

    const data = result[0]

    // 检查是否过期
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at)
      if (expiresAt < new Date()) {
        return res.status(410).json({ 
          success: false, 
          error: 'Wall has expired' 
        })
      }
    }

    // 返回配置数据
    return res.status(200).json({
      success: true,
      data: {
        title: data.title,
        messages: data.messages,
        musicTracks: data.music_tracks,
        colors: data.colors,
        settings: data.settings,
        expiresAt: data.expires_at
      }
    })

  } catch (error) {
    console.error('Error fetching wall:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
