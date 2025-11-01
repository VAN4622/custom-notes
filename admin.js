// 管理后台 JavaScript

let isAuthenticated = false
let musicCount = 0

// 登录
async function login() {
	const password = document.getElementById('loginPassword').value
	const errorDiv = document.getElementById('loginError')

	try {
		const response = await fetch('/api/admin/auth', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password })
		})

		const result = await response.json()

		if (result.success) {
			isAuthenticated = true
			sessionStorage.setItem('adminAuth', 'true')
			document.getElementById('loginSection').classList.add('hidden')
			document.getElementById('adminSection').classList.remove('hidden')
			loadWalls()
		} else {
			errorDiv.textContent = '密码错误'
			errorDiv.classList.remove('hidden')
		}
	} catch (error) {
		errorDiv.textContent = '登录失败: ' + error.message
		errorDiv.classList.remove('hidden')
	}
}

// 检查登录状态
function checkAuth() {
	if (sessionStorage.getItem('adminAuth') === 'true') {
		document.getElementById('loginSection').classList.add('hidden')
		document.getElementById('adminSection').classList.remove('hidden')
		loadWalls()
	}
}

// 显示提示
function showAlert(message, type = 'success') {
	const alertBox = document.getElementById('alertBox')
	alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`
	setTimeout(() => {
		alertBox.innerHTML = ''
	}, 5000)
}

// 添加音乐
function addMusic() {
	musicCount++
	const musicList = document.getElementById('musicList')

	if (musicList.querySelector('p')) {
		musicList.innerHTML = ''
	}

	const musicItem = document.createElement('div')
	musicItem.className = 'music-item'
	musicItem.id = `music-${musicCount}`
	musicItem.innerHTML = `
		<button type="button" class="remove-music" onclick="removeMusic(${musicCount})">×</button>
		<input type="text" placeholder="音乐名称" class="music-name" />
		<input type="text" placeholder="艺术家" class="music-artist" />
		<input type="url" placeholder="音乐链接 (HTTPS)" class="music-src" />
	`
	musicList.appendChild(musicItem)
}

// 删除音乐
function removeMusic(id) {
	const musicItem = document.getElementById(`music-${id}`)
	musicItem.remove()

	const musicList = document.getElementById('musicList')
	if (musicList.children.length === 0) {
		musicList.innerHTML = '<p style="color: #999; text-align: center;">暂无音乐，点击下方按钮添加</p>'
	}
}

// 创建便签墙
async function createWall(event) {
	event.preventDefault()

	const slug = document.getElementById('slug').value.trim()
	const title = document.getElementById('title').value.trim()
	const messagesText = document.getElementById('messages').value.trim()
	const expiryDays = document.getElementById('expiryDays').value

	// 解析便签内容
	const messages = messagesText.split('\n').map(m => m.trim()).filter(m => m)

	if (messages.length === 0) {
		showAlert('请至少添加一条便签内容', 'error')
		return
	}

	// 解析音乐列表
	const musicTracks = []
	const musicItems = document.querySelectorAll('.music-item')
	musicItems.forEach(item => {
		const name = item.querySelector('.music-name').value.trim()
		const artist = item.querySelector('.music-artist').value.trim()
		const src = item.querySelector('.music-src').value.trim()

		if (name && artist && src) {
			musicTracks.push({ name, artist, src })
		}
	})

	// 计算过期时间
	let expiresAt = null
	if (expiryDays) {
		const days = parseInt(expiryDays)
		const date = new Date()
		date.setDate(date.getDate() + days)
		expiresAt = date.toISOString()
	}

	try {
		const response = await fetch('/api/admin/create-wall', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				slug,
				title,
				messages,
				musicTracks,
				expiresAt
			})
		})

		const result = await response.json()

		if (result.success) {
			showAlert(`✅ 创建成功！访问链接: ${window.location.origin}/${slug}`)
			document.getElementById('createForm').reset()
			document.getElementById('musicList').innerHTML = '<p style="color: #999; text-align: center;">暂无音乐，点击下方按钮添加</p>'
			musicCount = 0
			loadWalls()
		} else {
			showAlert('创建失败: ' + result.error, 'error')
		}
	} catch (error) {
		showAlert('创建失败: ' + error.message, 'error')
	}
}

// 加载便签墙列表
async function loadWalls() {
	const wallsList = document.getElementById('wallsList')
	wallsList.innerHTML = '<p style="color: #999; text-align: center;">加载中...</p>'

	try {
		const response = await fetch('/api/admin/list-walls')
		const result = await response.json()

		if (result.success && result.data.length > 0) {
			wallsList.innerHTML = result.data.map(wall => `
				<div class="wall-item">
					<div class="wall-info">
						<h3>${wall.title}</h3>
						<p>
							<strong>/${wall.slug}</strong> · 
							${wall.messages.length} 条便签 · 
							${wall.expires_at ? '过期: ' + new Date(wall.expires_at).toLocaleDateString() : '永不过期'}
						</p>
					</div>
					<div class="wall-actions">
						<button class="btn btn-primary" onclick="window.open('/${wall.slug}', '_blank')">访问</button>
						<button class="btn btn-secondary" onclick="deleteWall('${wall.slug}')">删除</button>
					</div>
				</div>
			`).join('')
		} else {
			wallsList.innerHTML = '<p style="color: #999; text-align: center;">暂无便签墙</p>'
		}
	} catch (error) {
		wallsList.innerHTML = '<p style="color: #f00; text-align: center;">加载失败: ' + error.message + '</p>'
	}
}

// 删除便签墙
async function deleteWall(slug) {
	if (!confirm(`确定要删除便签墙 "${slug}" 吗？此操作不可恢复！`)) {
		return
	}

	try {
		const response = await fetch('/api/admin/delete-wall', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ slug })
		})

		const result = await response.json()

		if (result.success) {
			showAlert('删除成功')
			loadWalls()
		} else {
			showAlert('删除失败: ' + result.error, 'error')
		}
	} catch (error) {
		showAlert('删除失败: ' + error.message, 'error')
	}
}

// slug 预览
document.addEventListener('DOMContentLoaded', () => {
	const slugInput = document.getElementById('slug')
	const slugPreview = document.getElementById('slugPreview')

	if (slugInput && slugPreview) {
		slugInput.addEventListener('input', (e) => {
			slugPreview.textContent = e.target.value || 'your-slug'
		})
	}

	checkAuth()
})
