// 管理员认证 API

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
		const { password } = req.body
		const adminPassword = process.env.ADMIN_PASSWORD

		if (!adminPassword) {
			return res.status(500).json({ 
				success: false, 
				error: 'Admin password not configured' 
			})
		}

		if (password === adminPassword) {
			return res.status(200).json({ success: true })
		} else {
			return res.status(401).json({ success: false, error: 'Invalid password' })
		}
	} catch (error) {
		console.error('Auth error:', error)
		return res.status(500).json({ success: false, error: 'Internal server error' })
	}
}
