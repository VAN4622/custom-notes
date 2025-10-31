// 便签墙 - 动态加载版本
const board = document.getElementById('board')

// 默认配置
let messages = [
	'保持好心情',
	'多喝水哦',
	'今天辛苦啦',
	'早点休息',
	'记得吃水果',
	'加油，你可以的',
	'祝你顺利',
	'保持微笑呀',
	'愿所有烦恼都消失',
	'期待下一次见面',
	'梦想总会实现',
	'天气冷了，多穿衣服',
	'记得给自己放松',
	'每天都要元气满满',
	'今天也要好好爱自己',
	'适当休息一下'
]

let colors = [
	'#ffe0e3',
	'#c7f0ff',
	'#ffd8a8',
	'#d9f2d9',
	'#e5d7ff',
	'#f9f7d9',
	'#d2f0f8',
	'#ffd4f5'
]

let musicTracks = [
	{ 
		name: 'Lofi Hip Hop', 
		artist: 'Chill Beats', 
		src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' 
	},
	{ 
		name: 'Relaxing Piano', 
		artist: 'Peaceful Music', 
		src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' 
	}
]

const cardStates = new WeakMap()
const MAXIMIZED_LAYER = 1000000
let activeMaximizedCard = null
let isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768
let maxCards = isMobile ? 120 : 180
let initialCardCount = isMobile ? 18 : 30
let spawnInterval = isMobile ? 700 : 400
let zIndexCursor = 200

let settings = {
	spawnSpeed: 50,
	autoSpawn: true,
	showAnimations: true
}

let spawnIntervalId = null
let currentTrackIndex = 0
let isPlaying = false
let isInitialized = false

document.body.classList.toggle('is-mobile', isMobile)

// 从 URL 获取 slug 参数
function getSlugFromURL() {
	const path = window.location.pathname
	const slug = path.split('/').filter(Boolean)[0]
	return slug || null
}

// 从 API 加载配置
async function loadWallConfig() {
	const slug = getSlugFromURL()
	
	if (!slug) {
		console.log('使用默认配置')
		return true
	}

	try {
		const apiUrl = `/api/wall?slug=${encodeURIComponent(slug)}`
		const response = await fetch(apiUrl)
		const result = await response.json()

		if (!result.success) {
			if (response.status === 404) {
				alert(`找不到便签墙: ${slug}`)
			} else if (response.status === 410) {
				alert('该便签墙已过期')
			} else {
				alert('加载失败: ' + result.error)
			}
			return false
		}

		// 更新配置
		const { data } = result
		if (data.title) {
			document.title = data.title
		}
		if (data.messages && data.messages.length > 0) {
			messages = data.messages
		}
		if (data.colors && data.colors.length > 0) {
			colors = data.colors
		}
		if (data.musicTracks && data.musicTracks.length > 0) {
			musicTracks = data.musicTracks
		}
		if (data.settings) {
			settings = { ...settings, ...data.settings }
			if (data.settings.maxCards) maxCards = data.settings.maxCards
			if (data.settings.initialCardCount) initialCardCount = data.settings.initialCardCount
		}

		console.log('配置加载成功:', data.title)
		return true

	} catch (error) {
		console.error('加载配置失败:', error)
		alert('网络错误，使用默认配置')
		return true
	}
}

function randomFrom(array) {
	return array[Math.floor(Math.random() * array.length)]
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max)
}

function applyTransform(card, state) {
	const scale = state.scale ?? 1
	const translateX = state.translateX ?? 0
	const translateY = state.translateY ?? 0
	const angle = state.angle ?? 0
	card.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${angle}deg)`
}

function bringToFront(card) {
	if (card === activeMaximizedCard) {
		card.style.zIndex = MAXIMIZED_LAYER
		return
	}
	zIndexCursor += 1
	if (activeMaximizedCard && zIndexCursor >= MAXIMIZED_LAYER) {
		zIndexCursor = MAXIMIZED_LAYER - 1
	}
	card.style.zIndex = zIndexCursor
}

function setupCardInteractions(card) {
	const header = card.querySelector('.card-header')
	const closeBtn = card.querySelector('.control.close')
	const minimizeBtn = card.querySelector('.control.minimize')
	const maximizeBtn = card.querySelector('.control.maximize')

	closeBtn.addEventListener('click', event => {
		event.stopPropagation()
		closeCard(card)
	})

	minimizeBtn.addEventListener('click', event => {
		event.stopPropagation()
		minimizeCard(card)
	})

	maximizeBtn.addEventListener('click', event => {
		event.stopPropagation()
		toggleMaximize(card)
	})

	header.addEventListener('pointerdown', event => {
		if (event.pointerType === 'touch') return
		startDrag(event, card)
	})

	card.addEventListener('pointerdown', () => {
		bringToFront(card)
	})

	header.addEventListener('dblclick', event => {
		if (!event.target.closest('.control')) {
			toggleMaximize(card)
		}
	})
}

function closeCard(card) {
	const state = cardStates.get(card)
	if (!state || state.closing) return
	if (card === activeMaximizedCard) {
		activeMaximizedCard = null
	}
	state.closing = true
	state.scale = 0.1
	card.style.opacity = '0'
	applyTransform(card, state)

	const handleTransitionEnd = event => {
		if (event.propertyName === 'opacity') {
			card.removeEventListener('transitionend', handleTransitionEnd)
			card.remove()
		}
	}
	card.addEventListener('transitionend', handleTransitionEnd)
}

function minimizeCard(card) {
	const state = cardStates.get(card)
	if (!state || state.closing) return

	const runMinimize = () => {
		state.closing = true
		bringToFront(card)
		const bottom = Math.max(window.innerHeight - 24, 0)
		const targetLeft = clamp(state.left, 16, Math.max(window.innerWidth - card.offsetWidth - 16, 16))

		state.left = targetLeft
		state.top = bottom
		state.scale = 0.1
		state.angle = 0
		card.style.left = `${targetLeft}px`
		card.style.top = `${bottom}px`
		card.style.opacity = '0.35'
		applyTransform(card, state)

		const handleTransitionEnd = event => {
			if (event.propertyName === 'transform') {
				card.removeEventListener('transitionend', handleTransitionEnd)
				card.remove()
			}
		}
		card.addEventListener('transitionend', handleTransitionEnd)
	}

	if (state.maximized) {
		activeMaximizedCard = null
		state.maximized = false
		card.classList.remove('maximized')
		card.style.borderRadius = '12px'
		state.left = 0
		state.top = 0
		state.scale = 1
		state.angle = 0
		applyTransform(card, state)
		requestAnimationFrame(() => {
			requestAnimationFrame(runMinimize)
		})
		return
	}
	runMinimize()
}

function toggleMaximize(card) {
	const state = cardStates.get(card)
	if (!state || state.closing) return
	if (state.maximized) {
		restoreFromMaximize(card, state)
	} else {
		maximizeCard(card, state)
	}
}

function maximizeCard(card, state) {
	state.beforeMaximize = {
		left: state.left,
		top: state.top,
		scale: state.scale ?? 1,
		width: card.offsetWidth,
		height: card.offsetHeight,
		angle: state.angle ?? 0
	}
	card.classList.add('maximized')
	card.style.left = '0px'
	card.style.top = '0px'
	card.style.width = `${window.innerWidth}px`
	card.style.height = `${window.innerHeight}px`
	card.style.borderRadius = '0'
	state.left = 0
	state.top = 0
	state.scale = 1
	state.angle = 0
	applyTransform(card, state)
	activeMaximizedCard = card
	bringToFront(card)
	state.maximized = true
}

function restoreFromMaximize(card, state) {
	const previous = state.beforeMaximize
	if (!previous) return
	card.classList.remove('maximized')
	card.style.left = `${previous.left}px`
	card.style.top = `${previous.top}px`
	card.style.width = `${previous.width}px`
	card.style.height = `${previous.height}px`
	card.style.borderRadius = '12px'
	state.left = previous.left
	state.top = previous.top
	state.scale = previous.scale ?? 1
	state.angle = previous.angle ?? state.angle ?? 0
	applyTransform(card, state)
	state.maximized = false
	if (activeMaximizedCard === card) {
		activeMaximizedCard = null
	}
	bringToFront(card)
	state.lastPosition = { left: state.left, top: state.top }
	setTimeout(() => {
		if (!state.maximized) {
			card.style.width = ''
			card.style.height = ''
			state.width = card.offsetWidth
			state.height = card.offsetHeight
		}
	}, 360)
}

function startDrag(event, card) {
	const control = event.target.closest('.control')
	if (control) return
	const state = cardStates.get(card)
	if (!state || state.closing || state.maximized) return
	event.preventDefault()
	bringToFront(card)
	const header = card.querySelector('.card-header')
	card.classList.add('dragging')
	header.classList.add('dragging')
	state.dragging = true
	state.dragOffsetX = event.clientX - state.left
	state.dragOffsetY = event.clientY - state.top
	let dragFrame = null
	let pendingLeft = state.left
	let pendingTop = state.top

	const commitDrag = () => {
		dragFrame = null
		const maxLeft = Math.max(window.innerWidth - card.offsetWidth, 0)
		const maxTop = Math.max(window.innerHeight - card.offsetHeight, 0)
		state.left = clamp(pendingLeft, -card.offsetWidth * 0.4, maxLeft)
		state.top = clamp(pendingTop, -card.offsetHeight * 0.4, maxTop)
		card.style.left = `${state.left}px`
		card.style.top = `${state.top}px`
	}

	const handlePointerMove = moveEvent => {
		if (!state.dragging) return
		pendingLeft = moveEvent.clientX - state.dragOffsetX
		pendingTop = moveEvent.clientY - state.dragOffsetY
		if (dragFrame === null) {
			dragFrame = requestAnimationFrame(commitDrag)
		}
	}

	const handlePointerUp = () => {
		state.dragging = false
		state.lastPosition = { left: state.left, top: state.top }
		card.classList.remove('dragging')
		header.classList.remove('dragging')
		if (dragFrame !== null) {
			cancelAnimationFrame(dragFrame)
			commitDrag()
		}
		document.removeEventListener('pointermove', handlePointerMove)
		document.removeEventListener('pointerup', handlePointerUp)
	}

	document.addEventListener('pointermove', handlePointerMove)
	document.addEventListener('pointerup', handlePointerUp)
}

function createCard() {
	const card = document.createElement('div')
	card.className = 'card'
	const color = randomFrom(colors)
	const angleRange = isMobile ? 6 : 10
	const angle = (Math.random() - 0.5) * angleRange
	const cardWidth = isMobile ? 180 : 220
	const cardHeight = isMobile ? 130 : 140
	const horizontalMargin = isMobile ? 12 : 16
	const verticalMargin = isMobile ? 12 : 20
	const left = horizontalMargin + Math.random() * Math.max(window.innerWidth - cardWidth - horizontalMargin * 2, 0)
	const top = verticalMargin + Math.random() * Math.max(window.innerHeight - cardHeight - verticalMargin * 2, 0)

	card.style.background = color
	card.style.left = `${left}px`
	card.style.top = `${top}px`
	if (activeMaximizedCard && zIndexCursor >= MAXIMIZED_LAYER - 2) {
		zIndexCursor = MAXIMIZED_LAYER - 2
	}
	card.style.zIndex = ++zIndexCursor

	card.innerHTML = `
		<div class="card-header">
			<div class="window-controls">
				<button class="control close" type="button" aria-label="关闭"></button>
				<button class="control minimize" type="button" aria-label="最小化"></button>
				<button class="control maximize" type="button" aria-label="最大化"></button>
			</div>
			<div class="card-title">温馨提示</div>
		</div>
		<div class="card-body">${randomFrom(messages)}</div>
	`

	const state = {
		angle,
		scale: settings.showAnimations ? (isMobile ? 0.85 : 0.7) : 1,
		translateX: 0,
		translateY: 0,
		left,
		top,
		maximized: false,
		closing: false,
		lastPosition: { left, top }
	}

	cardStates.set(card, state)
	applyTransform(card, state)
	board.appendChild(card)
	state.width = card.offsetWidth
	state.height = card.offsetHeight

	if (settings.showAnimations) {
		requestAnimationFrame(() => {
			state.scale = 1
			applyTransform(card, state)
			card.style.opacity = '1'
		})
	} else {
		card.style.opacity = '1'
	}

	setupCardInteractions(card)

	if (board.children.length > maxCards) {
		const oldest = board.firstElementChild
		if (oldest && oldest !== card) {
			oldest.remove()
		}
	}
}

// 设置面板功能
function initSettings() {
	const settingsBtn = document.getElementById('settingsBtn')
	const settingsPanel = document.getElementById('settingsPanel')
	const spawnSpeedSlider = document.getElementById('spawnSpeed')
	const spawnSpeedValue = document.getElementById('spawnSpeedValue')
	const autoSpawnToggle = document.getElementById('autoSpawn')
	const animationsToggle = document.getElementById('showAnimations')

	settingsBtn.addEventListener('click', () => {
		settingsPanel.classList.toggle('show')
	})

	document.addEventListener('click', (e) => {
		if (!settingsPanel.contains(e.target) && !settingsBtn.contains(e.target)) {
			settingsPanel.classList.remove('show')
		}
	})

	spawnSpeedSlider.addEventListener('input', (e) => {
		settings.spawnSpeed = parseInt(e.target.value)
		spawnSpeedValue.textContent = settings.spawnSpeed + '%'
		updateSpawnInterval()
	})

	autoSpawnToggle.addEventListener('change', (e) => {
		settings.autoSpawn = e.target.checked
		if (settings.autoSpawn) {
			startAutoSpawn()
		} else {
			stopAutoSpawn()
		}
	})

	animationsToggle.addEventListener('change', (e) => {
		settings.showAnimations = e.target.checked
	})
}

function updateSpawnInterval() {
	const baseInterval = isMobile ? 700 : 400
	spawnInterval = baseInterval * (100 / settings.spawnSpeed)
	if (settings.autoSpawn && spawnIntervalId) {
		stopAutoSpawn()
		startAutoSpawn()
	}
}

function startAutoSpawn() {
	if (spawnIntervalId) return
	spawnIntervalId = setInterval(() => {
		createCard()
	}, spawnInterval)
}

function stopAutoSpawn() {
	if (spawnIntervalId) {
		clearInterval(spawnIntervalId)
		spawnIntervalId = null
	}
}

// 音乐播放器功能
function initMusicPlayer() {
	const audio = document.getElementById('audio')
	const playBtn = document.getElementById('playBtn')
	const prevBtn = document.getElementById('prevBtn')
	const nextBtn = document.getElementById('nextBtn')
	const volumeSlider = document.getElementById('volumeSlider')
	const trackName = document.getElementById('trackName')
	const trackArtist = document.getElementById('trackArtist')

	function updateTrackInfo() {
		const track = musicTracks[currentTrackIndex]
		trackName.textContent = track.name
		trackArtist.textContent = track.artist
		audio.src = track.src
	}

	function togglePlay() {
		if (!audio.src || audio.src === window.location.href) {
			alert('请先添加音乐文件！\n\n提示：在数据库中配置音乐外链地址')
			return
		}

		if (isPlaying) {
			audio.pause()
			playBtn.textContent = '▶'
			isPlaying = false
		} else {
			const playPromise = audio.play()
			if (playPromise !== undefined) {
				playPromise.then(() => {
					playBtn.textContent = '⏸'
					isPlaying = true
				}).catch(err => {
					console.error('播放失败:', err)
					alert('播放失败，可能是音乐链接无效或需要用户交互才能播放')
					isPlaying = false
					playBtn.textContent = '▶'
				})
			}
		}
	}

	function playPrev() {
		currentTrackIndex = (currentTrackIndex - 1 + musicTracks.length) % musicTracks.length
		updateTrackInfo()
		if (isPlaying) {
			audio.play()
		}
	}

	function playNext() {
		currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length
		updateTrackInfo()
		if (isPlaying) {
			audio.play()
		}
	}

	playBtn.addEventListener('click', togglePlay)
	prevBtn.addEventListener('click', playPrev)
	nextBtn.addEventListener('click', playNext)

	volumeSlider.addEventListener('input', (e) => {
		audio.volume = e.target.value / 100
	})

	audio.addEventListener('ended', () => {
		playNext()
	})

	audio.addEventListener('error', () => {
		console.error('音频加载失败')
		isPlaying = false
		playBtn.textContent = '▶'
	})

	updateTrackInfo()
}

// 初始化应用
async function initApp() {
	if (isInitialized) return
	isInitialized = true

	// 加载配置
	const success = await loadWallConfig()
	if (!success) {
		return
	}

	// 初始化卡片
	for (let i = 0; i < initialCardCount; i++) {
		setTimeout(createCard, i * (isMobile ? 60 : 40))
	}

	// 启动自动生成
	if (settings.autoSpawn) {
		startAutoSpawn()
	}

	// 初始化设置和音乐播放器
	initSettings()
	initMusicPlayer()
}

// 窗口大小变化处理
window.addEventListener('resize', () => {
	isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768
	document.body.classList.toggle('is-mobile', isMobile)

	document.querySelectorAll('.card.maximized').forEach(card => {
		card.style.width = `${window.innerWidth}px`
		card.style.height = `${window.innerHeight}px`
	})
})

// 启动应用
initApp()
