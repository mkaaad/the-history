import React, {useState, useEffect, useRef} from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import './App.css'; // 引入分离出来的 CSS

// --- 模拟数据 ---
const CHARACTERS = [
	{id: 1, name: '李白', era: '唐朝', status: '日常状态', color: 'blue'},
	{id: 2, name: '岳飞', era: '宋朝', status: '意气风发', color: 'red'},
];

export default function HistoricalGame() {
	const [currentView, setCurrentView] = useState('start');
	const [player, setPlayer] = useState(null);

	// 1. 开始页面
	const StartScreen = () => (
		<div className="screen-centered bg-light">
			<h1 className="title-main">历史模拟器</h1>
			<button className="btn btn-primary" onClick={() => setCurrentView('select')}>
				开始游戏
			</button>
		</div>
	);

	// 2. 选择页面
	const SelectScreen = () => (
		<div className="screen-centered bg-gray">
			<h2 className="title-sub">选择目标角色</h2>
			<div className="card-container">
				{CHARACTERS.map(c => (
					<div
						key={c.id}
						className="character-card"
						onClick={() => {
							setPlayer(c);
							setCurrentView('game');
						}}
					>
						<h3 className="character-name">{c.name}</h3>
						<p className="character-era">{c.era}</p>
					</div>
				))}
			</div>
		</div>
	);

	// 3. 游戏与地图页面
	const GameScreen = () => {
		const mapRef = useRef(null);
		let mapInstance = null;

		useEffect(() => {
			AMapLoader.load({
				key: 'b24c453d0de31c0fe0d4fa7a3fbef70b', // ⚠️ 请替换
				version: '2.0',
				plugins: ['AMap.Marker', 'AMap.CircleMarker'],
			}).then((AMap) => {
				mapInstance = new AMap.Map(mapRef.current, {
					viewMode: '3D',
					zoom: 5,
					center: [108.93984, 34.34127],
				});

				// 标注人物所在地
				const marker = new AMap.Marker({
					position: new AMap.LngLat(108.93984, 34.34127),
					title: player.name + '的所在地'
				});
				mapInstance.add(marker);

				// 发光事件点
				const eventMarker = new AMap.CircleMarker({
					center: [112.93984, 34.34127],
					radius: 10,
					strokeColor: 'white',
					strokeWeight: 2,
					fillColor: 'gold',
					fillOpacity: 0.8,
				});
				mapInstance.add(eventMarker);

				// 触发对话
				eventMarker.on('click', () => {
					setCurrentView('dialog');
				});

			}).catch(e => {
				console.error("高德地图加载失败", e);
			});

			return () => {
				mapInstance?.destroy();
			};
		}, []);

		const avatarClass = `avatar avatar-${player.color || 'gray'}`;

		return (
			<div className="game-container">
				{/* 地图底层 */}
				<div ref={mapRef} className="map-layer" />

				{/* 左上：状态面板 */}
				<div className="ui-overlay overlay-top-left">
					<div className={avatarClass}>头像</div>
					<div>
						<div><strong>{player.name} ({player.era})</strong></div>
						<div style={{fontSize: '0.9rem', color: '#4b5563'}}>状态: {player.status}</div>
						<div style={{fontSize: '0.8rem', color: '#6b7280'}}>官位: 翰林学士 | 心情: 佳</div>
					</div>
				</div>

				{/* 右上：功能按钮 */}
				<div className="overlay-top-right">
					<button className="btn-glass">⚙️ 设置</button>
					<button className="btn-glass">👥 人物关系图</button>
				</div>

				{/* 底部：时间轴 */}
				<div className="ui-overlay overlay-bottom">
					<div className="timeline-hint">下方发光点出现触发关键选择 (请点击地图上的金色圆点)</div>

					<div className="timeline-track">
						<span style={{fontSize: '0.8rem'}}>公元701年</span>
						<div className="track-line">
							<div className="point-normal"></div>
							<div className="point-active"></div>
						</div>
						<span style={{fontSize: '0.8rem'}}>公元762年</span>
					</div>

					<div className="bottom-actions">
						<button onClick={() => setCurrentView('select')} style={{color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer'}}>返回重选</button>
						<button onClick={() => setCurrentView('dialog')} className="btn btn-warning" style={{padding: '0.5rem 1rem'}}>手动触发事件</button>
					</div>
				</div>
			</div>
		);
	};

	// 4. 对话页面
	const DialogScreen = () => (
		<div className="dialog-screen bg-dark">
			<h2 className="title-sub">历史事件抉择 (AI对话)</h2>
			<div className="dialog-content">
				<p style={{marginBottom: '1rem'}}><strong>系统/AI:</strong> 权臣当道，你决定上书直言，还是明哲保身？</p>
				<p style={{color: '#9ca3af', fontStyle: 'italic'}}>...此处为AI流式输出区域...</p>
			</div>
			<div className="dialog-actions">
				<button onClick={() => setCurrentView('end')} className="btn btn-danger">直言极谏 (按历史进程 - 导致死亡)</button>
				<button onClick={() => setCurrentView('game')} className="btn btn-primary" style={{flex: 1}}>明哲保身 (额外选择 - 返回)</button>
			</div>
		</div>
	);

	// 5. 死亡页面
	const EndScreen = () => (
		<div className="screen-centered bg-black">
			<div className="animate-fade-in text-center">
				<h1 className="tomb-text">卒</h1>
				<h2 className="title-sub">到达人生尽头</h2>
				<div className="summary-box">
					<h3 className="summary-title">生平总结</h3>
					<p style={{lineHeight: 1.6, color: '#d1d5db'}}>
						{player?.name}，一生波澜壮阔。在刚才的抉择中，你选择了历史的必然...
						(此处接入AI生成的生平总结)
					</p>
				</div>
				<button
					onClick={() => setCurrentView('start')}
					className="btn btn-outline"
					style={{marginTop: '3rem'}}
				>
					重新开始，更换人物
				</button>
			</div>
		</div>
	);

	return (
		<div className="app-container">
			{currentView === 'start' && <StartScreen />}
			{currentView === 'select' && <SelectScreen />}
			{currentView === 'game' && <GameScreen />}
			{currentView === 'dialog' && <DialogScreen />}
			{currentView === 'end' && <EndScreen />}
		</div>
	);
}
