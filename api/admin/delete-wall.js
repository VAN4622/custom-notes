// 删除便签墙 API

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
		const { slug } = req.body

		if (!slug) {
			return res.status(400).json({ 
				success: false, 
				error: 'Missing slug' 
			})
		}

		const sql = neon(process.env.DATABASE_URL)

		const result = await sql`
			DELETE FROM note_walls
			WHERE slug = ${slug}
			RETURNING slug
		`

		if (result && result.length > 0) {
			return res.status(200).json({ 
				success: true, 
				message: 'Wall deleted successfully' 
			})
		} else {
			return res.status(404).json({ 
				success: false, 
				error: 'Wall not found' 
			})
		}
	} catch (error) {
		console.error('Delete wall error:', error)
		return res.status(500).json({ 
			success: false, 
			error: 'Internal server error' 
		})
	}
}
