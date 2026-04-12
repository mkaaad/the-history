import React, {useState, useEffect, useRef, useMemo} from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import RightSidebar from './RightSidebar';
import '../styles/common.css';
import '../styles/GameScreen.css';

// 导入关键抉择数据
import liBaiOptions from '../data/li_bai_option.json';
import liQingzhaoOptions from '../data/li_qingzhao_option.json';
import suShiOptions from '../data/su_shi_option.json';

const GameScreen = ({player, onBackToSelect, onManualTrigger}) => {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const amapRef = useRef(null);
	const markersRef = useRef([]); // 存储 Marker 实例列表
	const polylineRef = useRef(null); // 存储轨迹线实例
	const iconsRef = useRef({normal: null, selected: null}); // 存储图标实例
	const [currentEventIndex, setCurrentEventIndex] = useState(0);
	const [isMapLoaded, setIsMapLoaded] = useState(false);
	// 关键抉择状态
	const [showChoice, setShowChoice] = useState(false);
	const [currentChoice, setCurrentChoice] = useState(null);
	const [choiceResult, setChoiceResult] = useState(null); // 'correct' 或 'wrong'
	const [choiceResultContent, setChoiceResultContent] = useState('');
	const [completedChoices, setCompletedChoices] = useState([]); // 已正确完成的抉择年份
	const showChoiceRef = useRef(showChoice); // 用于在useEffect中访问最新的showChoice值
	const choiceResultRef = useRef(choiceResult); // 用于在useEffect中访问最新的choiceResult值
	
	// 同步showChoice到ref
	useEffect(() => {
		showChoiceRef.current = showChoice;
	}, [showChoice]);

	// 同步choiceResult到ref
	useEffect(() => {
		choiceResultRef.current = choiceResult;
	}, [choiceResult]);

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

	// 获取当前人物的关键抉择数据
	const choiceData = useMemo(() => {
		switch(player.name) {
			case '李白':
				return liBaiOptions;
			case '李清照':
				return liQingzhaoOptions;
			case '苏轼':
				return suShiOptions;
			default:
				return [];
		}
	}, [player.name]);

	const eventPaths = useMemo(() => sortedEvents.map(e => [e.longitude, e.latitude]), [sortedEvents]);

	// 处理抉择选择
	const handleChoiceSelect = (optionIndex) => {
		if (!currentChoice) return;
		
		const isCorrect = optionIndex === 1; // 第二个选项是正确的
		
		if (isCorrect) {
			// 正确选择：显示与抉择年份相等的start_year的content
			let correctContent = '';
			// 查找年份等于当前抉择年份的事件
			const sameYearEvent = sortedEvents.find(event => event.start_year === currentChoice.year);
			if (sameYearEvent) {
				correctContent = sameYearEvent.content || '';
			} else {
				// 如果没有对应年份的事件，显示当前事件的content作为后备
				correctContent = sortedEvents[currentEventIndex].content || '';
			}
			
			setChoiceResult('correct');
			setChoiceResultContent(correctContent);
			// 记录已完成的抉择
			if (!completedChoices.includes(currentChoice.year)) {
				setCompletedChoices(prev => [...prev, currentChoice.year]);
			}
		} else {
			// 错误选择：显示end_content
			setChoiceResult('wrong');
			setChoiceResultContent(currentChoice.end_content || '');
		}
	};

	// 重新选择
	const handleRetryChoice = () => {
		setChoiceResult(null);
		setChoiceResultContent('');
	};

	// 继续游戏（正确选择后关闭抉择界面并前进到下一个节点）
	const handleContinue = () => {
		setShowChoice(false);
		setCurrentChoice(null);
		setChoiceResult(null);
		setChoiceResultContent('');
		
		// 前进到下一个事件（如果存在）
		if (currentEventIndex < sortedEvents.length - 1) {
			setCurrentEventIndex(prev => prev + 1);
		}
	};

	// 时间轴点击处理
	const handleTimelineClick = (index) => {
		if (showChoice) {
			// 正在显示抉择，不允许切换事件
			return;
		}
		setCurrentEventIndex(index);
	};

	// 检查当前事件是否有关键抉择
	useEffect(() => {
		if (!sortedEvents.length || !choiceData.length) return;
		
		const currentEvent = sortedEvents[currentEventIndex];
		if (!currentEvent) return;
		
		// 查找与当前事件年份匹配的抉择
		const matchingChoice = choiceData.find(choice => 
			choice.name === player.name && choice.year === currentEvent.start_year
		);
		
		// 如果找到了匹配的抉择且尚未完成
		if (matchingChoice && !completedChoices.includes(matchingChoice.year)) {
			setCurrentChoice(matchingChoice);
			setShowChoice(true);
			setChoiceResult(null);
			setChoiceResultContent('');
		} else {
			// 没有抉择或已完成的抉择，确保隐藏抉择界面
			// 但如果正在显示结果（choiceResult不为null），则不要隐藏，让用户看到结果
			if (!choiceResultRef.current) {
				setShowChoice(false);
				setCurrentChoice(null);
			}
		}
	}, [currentEventIndex, sortedEvents, choiceData, player.name, completedChoices]);



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
			marker.on('click', () => {
				if (!showChoiceRef.current) {
					setCurrentEventIndex(index);
				}
			});
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

			<RightSidebar event={sortedEvents[currentEventIndex]} />

			{/* 关键抉择弹窗 */}
			{showChoice && currentChoice && (
				<div className="choice-modal-overlay">
					<div className="choice-modal">
						<div className="choice-modal-header">
							<h3>关键抉择</h3>
							<p className="choice-year">{currentChoice.year}年</p>
						</div>
						<div className="choice-modal-content">
							<p className="choice-description">{currentChoice.description}</p>
							
							{!choiceResult ? (
								<div className="choice-options">
									{currentChoice.option.map((optionText, index) => (
										<button
											key={index}
											className="choice-option"
											onClick={() => handleChoiceSelect(index)}
										>
											{optionText}
										</button>
									))}
								</div>
							) : (
								<div className="choice-result">
									<div className={`result-content ${choiceResult === 'correct' ? 'correct' : 'wrong'}`}>
										{choiceResultContent}
									</div>
									<div className="choice-result-actions">
										{choiceResult === 'wrong' ? (
											<button className="btn-chinese" onClick={handleRetryChoice}>
												重新选择
											</button>
										) : (
											<button className="btn-chinese" onClick={handleContinue}>
												继续游戏
											</button>
										)}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}


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
								onClick={() => handleTimelineClick(idx)}
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
