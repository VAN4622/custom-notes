// 创建便签墙 API

import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
	res.setHeader('Access-Control-Allow-Credentials', true)
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

	if (req.method === 'OPTIONS') {
		res.status(200).end()
		return
	}

	if (req.method !== 'POST') {
		return res.status(405).json({ success: false, error: 'Method not allowed' })
	}

	try {
		const { slug, title, messages, musicTracks, expiresAt } = req.body

		if (!slug || !title || !messages || messages.length === 0) {
			return res.status(400).json({ 
				success: false, 
				error: 'Missing required fields' 
			})
		}

		const sql = neon(process.env.DATABASE_URL)

		const result = await sql`
			INSERT INTO note_walls (slug, title, messages, music_tracks, expires_at)
			VALUES (
				${slug},
				${title},
				${JSON.stringify(messages)}::jsonb,
				${JSON.stringify(musicTracks || [])}::jsonb,
				${expiresAt}
			)
			RETURNING *
		`

		if (result && result.length > 0) {
			return res.status(200).json({ 
				success: true, 
				data: result[0] 
			})
		} else {
			return res.status(500).json({ 
				success: false, 
				error: 'Failed to create wall' 
			})
		}
	} catch (error) {
		console.error('Create wall error:', error)
		
		if (error.message.includes('duplicate key')) {
			return res.status(400).json({ 
				success: false, 
				error: 'Slug already exists' 
			})
		}

		return res.status(500).json({ 
			success: false, 
			error: 'Internal server error' 
		})
	}
}
