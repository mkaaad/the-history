import React, {useState, useEffect, useRef, useMemo} from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import RightSidebar from './RightSidebar';
import '../styles/common.css';
import '../styles/GameScreen.css';

const GameScreen = ({player, onBackToSelect, onManualTrigger}) => {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const amapRef = useRef(null);
	const markersRef = useRef([]); // 存储 Marker 实例列表
	const polylineRef = useRef(null); // 存储轨迹线实例
	const iconsRef = useRef({normal: null, selected: null}); // 存储图标实例
	const [currentEventIndex, setCurrentEventIndex] = useState(0);
	const [isMapLoaded, setIsMapLoaded] = useState(false);

	// 1. 处理数据
	const sortedEvents = useMemo(() => {
		const unique = Array.from(new Set(player.events.map(e => JSON.stringify(e)))).map(s => JSON.parse(s));
		const sorted = unique.sort((a, b) => a.start_year - b.start_year);

		// 过滤同年事件：每个年份只保留一个事件（优先保留包含"岁"的事件）
		const yearMap = new Map();
		const filtered = [];

		sorted.forEach(event => {
			const year = event.start_year;
			const existing = yearMap.get(year);

			if (!existing) {
				yearMap.set(year, event);
				filtered.push(event);
			} else {
				// 如果已有同年事件，检查当前事件是否包含"岁"
				const currentHasAge = event.state?.includes('岁');
				const existingHasAge = existing.state?.includes('岁');

				if (currentHasAge && !existingHasAge) {
					// 当前事件包含年龄，替换原有事件
					const index = filtered.findIndex(e => e === existing);
					if (index !== -1) {
						filtered[index] = event;
						yearMap.set(year, event);
					}
				}
				// 否则忽略当前事件
			}
		});

		return filtered;
	}, [player.events]);

	const eventPaths = useMemo(() => sortedEvents.map(e => [e.longitude, e.latitude]), [sortedEvents]);



	// 2. 初始化地图 (仅执行一次)
	useEffect(() => {
		AMapLoader.load({
			key: 'b24c453d0de31c0fe0d4fa7a3fbef70b',
			version: '2.0',
			plugins: ['AMap.Polyline', 'AMap.CircleMarker'],
		}).then((AMap) => {
			amapRef.current = AMap;
			const map = new AMap.Map(mapRef.current, {
				resizeEnable: true,
				zoom: 5,
				center: [108.93984, 34.34127],
				mapStyle: 'amap://styles/1f31d45ad8388e6139202a76bc1ff339',
			});

			mapInstanceRef.current = map;
			setIsMapLoaded(true);
		});
		return () => mapInstanceRef.current?.destroy();
	}, []);

	// 3. 绘制静态线段和初始化标记 (仅在数据变化时执行，切换点时不触发)
	useEffect(() => {
		if (!isMapLoaded) return;
		const AMap = amapRef.current;
		const map = mapInstanceRef.current;

		// 清除旧的线和点
		if (polylineRef.current) polylineRef.current.setMap(null);
		markersRef.current.forEach(m => m.setMap(null));
		markersRef.current = [];

		// 绘制轨迹线 (全生命周期只在这里绘制一次)
		const polyline = new AMap.Polyline({
			path: eventPaths,
			showDir: true,
			strokeColor: "#8E2323",
			strokeOpacity: 0.6,
			strokeWeight: 5,
			lineJoin: 'round'
		});
		map.add(polyline);
		polylineRef.current = polyline;

		// 初始化所有点标记（使用角色特定的PNG图标）
		iconsRef.current.normal = new AMap.Icon({
			image: player.markerIcon || 'images/markers/point.png',
			size: new AMap.Size(32, 32),
			imageSize: new AMap.Size(32, 32)
		});

		iconsRef.current.selected = new AMap.Icon({
			image: player.markerIconSelected || 'images/markers/point_selected.png',
			size: new AMap.Size(40, 40),
			imageSize: new AMap.Size(40, 40)
		});

		const newMarkers = sortedEvents.map((event, index) => {
			const marker = new AMap.Marker({
				position: [event.longitude, event.latitude],
				icon: iconsRef.current.normal,
				zIndex: 10,
				offset: new AMap.Pixel(-16, -16)
			});
			marker.on('click', () => setCurrentEventIndex(index));
			marker.setMap(map);
			return marker;
		});
		markersRef.current = newMarkers;

		// 自动缩放以适应所有点
		if (newMarkers.length > 0) map.setFitView(null, false, [60, 60, 60, 60]);

	}, [isMapLoaded, sortedEvents, eventPaths, player]);

	// 4. 处理点切换逻辑 (更新图标和视角)
	useEffect(() => {
		if (!isMapLoaded || markersRef.current.length === 0 || !iconsRef.current.normal || !iconsRef.current.selected || !amapRef.current) return;

		const AMap = amapRef.current;

		// 遍历所有 Marker 实例
		markersRef.current.forEach((marker, index) => {
			const isCurrent = index === currentEventIndex;

			// 更新图标和zIndex
			marker.setIcon(isCurrent ? iconsRef.current.selected : iconsRef.current.normal);
			marker.setzIndex(isCurrent ? 1000 : 100);

			// 调整偏移量以适应不同大小的图标
			if (isCurrent) {
				marker.setOffset(new AMap.Pixel(-20, -20));
			} else {
				marker.setOffset(new AMap.Pixel(-16, -16));
			}
		});

		// 平滑移动视角
		const currentEvent = sortedEvents[currentEventIndex];
		if (currentEvent) {
			mapInstanceRef.current.panTo([currentEvent.longitude, currentEvent.latitude], 800);
		}
	}, [currentEventIndex, isMapLoaded, sortedEvents]); // 注意依赖项包含 sortedEvents

	// ... 后面部分代码保持一致
	// UI 部分保持不变...
	const years = sortedEvents.flatMap(e => [e.start_year, e.end_year]);
	const minYear = years.length > 0 ? Math.min(...years) : 0;
	const maxYear = years.length > 0 ? Math.max(...years) : 100;

	// 计算时间轴点位置（基于事件时间中点）
	const totalSpan = maxYear - minYear;
	const eventPositions = sortedEvents.map((event, idx) => {
		if (totalSpan === 0) {
			// 所有事件在同一年，等分显示
			if (sortedEvents.length === 1) return 0.5;
			return idx / (sortedEvents.length - 1);
		}
		// 使用事件时间中点计算位置
		const eventMidYear = (event.start_year + event.end_year) / 2;
		return (eventMidYear - minYear) / totalSpan;
	});



	return (
		<div style={{width: '100%', height: '100vh', position: 'relative'}}>
			<div ref={mapRef} style={{width: '100%', height: '100%'}} />

			<RightSidebar />



			{/* 右上角返回按钮 */}
			<button className="btn-chinese btn-top-right" onClick={onBackToSelect}>
				返回选择
			</button>

			{/* 底部 UI */}
			<div className="bottom-panel">
				<div className="mb-3" style={{fontWeight: 'bold'}}>
					{sortedEvents[currentEventIndex]?.state} ({sortedEvents[currentEventIndex]?.start_year}年)
				</div>

				{/* 时间轴逻辑 */}
				<div className="timeline-container">
					<div className="timeline-track">
						{sortedEvents.map((_, idx) => (
							<img
								key={idx}
								src={idx === currentEventIndex ? (player.markerIconSelected || 'images/markers/point_selected.png') : (player.markerIcon || 'images/markers/point.png')}
								alt="时间点"
								className={`timeline-dot ${idx === currentEventIndex ? 'active' : ''}`}
								onClick={() => setCurrentEventIndex(idx)}
								style={{
									left: `${(eventPositions[idx] * 100)}%`
								}}
							/>
						))}
					</div>
				</div>

				<div className="btn-group">
					<button
						className="nav-btn"
						onClick={() => setCurrentEventIndex(i => Math.max(0, i - 1))}
						disabled={currentEventIndex === 0}
					>
						上一步
					</button>
					<button
						className="nav-btn"
						onClick={() => setCurrentEventIndex(i => Math.min(sortedEvents.length - 1, i + 1))}
						disabled={currentEventIndex === sortedEvents.length - 1}
					>
						下一步
					</button>
				</div>
			</div>
		</div>
	);
};

export default GameScreen;
