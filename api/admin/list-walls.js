// 列出所有便签墙 API

import { neon } from '@neondatabase/serverless'

export default async function handler(req, res) {
	res.setHeader('Access-Control-Allow-Credentials', true)
	res.setHeader('Access-Control-Allow-Origin', '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

	if (req.method === 'OPTIONS') {
		res.status(200).end()
		return
	}

	if (req.method !== 'GET') {
		return res.status(405).json({ success: false, error: 'Method not allowed' })
	}

	try {
		const sql = neon(process.env.DATABASE_URL)

		const result = await sql`
			SELECT 
				slug,
				title,
				messages,
				music_tracks,
				expires_at,
				created_at
			FROM note_walls
			ORDER BY created_at DESC
		`

		return res.status(200).json({ 
			success: true, 
			data: result 
		})
	} catch (error) {
		console.error('List walls error:', error)
		return res.status(500).json({ 
			success: false, 
			error: 'Internal server error' 
		})
	}
}
