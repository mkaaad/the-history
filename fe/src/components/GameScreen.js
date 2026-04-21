import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
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
	// 画线状态
	const [linePath, setLinePath] = useState(null); // 当前显示的弧线路径
	// 关键抉择状态
	const [showChoice, setShowChoice] = useState(false);
	const [currentChoice, setCurrentChoice] = useState(null);
	const [choiceResult, setChoiceResult] = useState(null); // 'correct' 或 'wrong'
	const [choiceResultContent, setChoiceResultContent] = useState('');
	const [completedChoices, setCompletedChoices] = useState([]); // 已正确完成的抉择年份
	const [pendingChoiceIndex, setPendingChoiceIndex] = useState(-1); // 等待处理的抉择事件索引
	const showChoiceRef = useRef(showChoice); // 用于在useEffect中访问最新的showChoice值
	const choiceResultRef = useRef(choiceResult); // 用于在useEffect中访问最新的choiceResult值
	// 诗作对话框状态
	const [showPoemDialog, setShowPoemDialog] = useState(false);
	const [poemText, setPoemText] = useState('');
	// 回顾一生状态
	const [showSummary, setShowSummary] = useState(false);
	const [showAllLines, setShowAllLines] = useState(false);
	const [summaryText, setSummaryText] = useState('');
	// 对话状态
	const [showChat, setShowChat] = useState(false);
	const [chatMessages, setChatMessages] = useState([]);
	const [userInput, setUserInput] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	
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

	// 计算弧形箭头路径（二次贝塞尔曲线，返回多个点构成弧线）
	const computeCurvePath = (start, end) => {
		// 验证输入坐标
		const [lng1, lat1] = start;
		const [lng2, lat2] = end;
		if (!Number.isFinite(lng1) || !Number.isFinite(lat1) || !Number.isFinite(lng2) || !Number.isFinite(lat2)) {
			console.warn('Invalid coordinates in computeCurvePath', start, end);
			return null;
		}
		// 计算垂直于两点连线的方向向量
		const dx = lng2 - lng1;
		const dy = lat2 - lat1;
		const length = Math.sqrt(dx * dx + dy * dy);
		// 防止除零错误
		if (length < 1e-6) {
			// 两点重合或非常接近，不画线
			return null;
		}
		// 垂直单位向量（旋转90度）
		const perpX = -dy / length;
		const perpY = dx / length;
		// 控制点偏移距离（弧高），取两点距离的0.3倍
		const offset = length * 0.3;
		// 二次贝塞尔曲线控制点（中点偏移）
		const controlPoint = [(lng1 + lng2) / 2 + perpX * offset, (lat1 + lat2) / 2 + perpY * offset];
		// 验证控制点坐标
		if (!Number.isFinite(controlPoint[0]) || !Number.isFinite(controlPoint[1])) {
			console.warn('Invalid control point computed', controlPoint);
			return [start, end];
		}
		// 生成弧线上的点（10个点）
		const points = [];
		const steps = 10;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const u = 1 - t;
			// 二次贝塞尔曲线公式：B(t) = (1-t)² * P0 + 2*(1-t)*t * P1 + t² * P2
			const lng = u * u * lng1 + 2 * u * t * controlPoint[0] + t * t * lng2;
			const lat = u * u * lat1 + 2 * u * t * controlPoint[1] + t * t * lat2;
			points.push([lng, lat]);
		}
		return points;
	};

	// 计算完整弧形路径（连接所有事件点）
	const computeFullCurvePath = useCallback(() => {
		if (!sortedEvents || sortedEvents.length < 2) return [];
		
		const fullPath = [];
		for (let i = 0; i < sortedEvents.length - 1; i++) {
			const currentEvent = sortedEvents[i];
			const nextEvent = sortedEvents[i + 1];
			const curvePath = computeCurvePath(
				[currentEvent.longitude, currentEvent.latitude],
				[nextEvent.longitude, nextEvent.latitude]
			);
			
			if (curvePath) {
				// 如果是第一段，添加所有点；否则跳过第一个点（避免重复）
				const pointsToAdd = i === 0 ? curvePath : curvePath.slice(1);
				fullPath.push(...pointsToAdd);
			}
		}
		return fullPath;
	}, [sortedEvents]);

	// 根据事件年份获取年龄对应的头像
	const getAvatarForEvent = (event) => {
		if (!event || !player.birthYear) return player.avatar || player.image;
		
		const age = event.start_year - player.birthYear;
		
		// 处理负数年龄（事件年份早于出生年份）
		if (age < 0 || age <= 30) {
			return player.avatarYoung || player.avatar || player.image;
		} else if (age <= 50) {
			return player.avatarMiddle || player.avatar || player.image;
		} else {
			return player.avatarOld || player.avatar || player.image;
		}
	};

	// 格式化诗作文本：统一标题格式，诗作内容一句一换行
	const formatPoemText = (work) => {
		if (!work) return '';
		
		// 处理标题：确保有书名号
		let title = work.title || '';
		if (title && !title.includes('《') && !title.includes('》')) {
			// 如果没有书名号，加上
			title = `《${title}》`;
		}
		
		// 处理内容：一句一换行（逗号后不换行）
		let content = work.content || '';
		if (content) {
			// 中文标点分割：句号、问号、感叹号、顿号、分号、冒号后换行（逗号后不换行）
			// 使用正则替换：在指定标点后添加换行符
			content = content
				.replace(/([。？！；：、])/g, '$1\n')
				.replace(/\n+/g, '\n')  // 合并多个换行
				.trim();  // 去除首尾空白
		}
		
		// 组合标题和内容
		if (title && content) {
			return `${title}\n${content}`;
		} else if (title) {
			return title;
		} else if (content) {
			return content;
		}
		return '';
	};

	// 检查当前事件是否有诗作并设置对话框
	const checkAndSetPoem = useCallback(() => {
		if (!sortedEvents.length || currentEventIndex < 0) {
			setShowPoemDialog(false);
			setPoemText('');
			return;
		}
		
		const currentEvent = sortedEvents[currentEventIndex];
		if (!currentEvent || !currentEvent.representative_works || currentEvent.representative_works.length === 0) {
			setShowPoemDialog(false);
			setPoemText('');
			return;
		}
		
		// 获取第一个诗作并格式化
		const firstWork = currentEvent.representative_works[0];
		const text = formatPoemText(firstWork);
		setPoemText(text);
		setShowPoemDialog(true);
	}, [currentEventIndex, sortedEvents]);

	// 当事件变化时更新诗作对话框
	useEffect(() => {
		checkAndSetPoem();
	}, [checkAndSetPoem]);



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
		
		// 如果有等待处理的抉择索引，前进到该事件
		if (pendingChoiceIndex !== -1) {
			const targetIndex = pendingChoiceIndex;
			const currentEvent = sortedEvents[currentEventIndex];
			const targetEvent = sortedEvents[targetIndex];
			if (currentEvent && targetEvent) {
				const curvePath = computeCurvePath(
					[currentEvent.longitude, currentEvent.latitude],
					[targetEvent.longitude, targetEvent.latitude]
				);
				setLinePath(curvePath);
			}
			setCurrentEventIndex(targetIndex);
			setPendingChoiceIndex(-1);
		} else if (currentEventIndex < sortedEvents.length - 1) {
			// 没有等待的抉择，正常前进
			handleNext();
		}
	};

	// 时间轴点击处理
	const handleTimelineClick = (index) => {
		if (showChoice) {
			// 正在显示抉择，不允许切换事件
			return;
		}
		setLinePath(null);
		setCurrentEventIndex(index);
		setPendingChoiceIndex(-1); // 清除等待的抉择
	};

	// 下一步按钮处理（绘制弧形箭头）
	const handleNext = () => {
		if (currentEventIndex < sortedEvents.length - 1) {
			const nextIndex = currentEventIndex + 1;
			const nextEvent = sortedEvents[nextIndex];
			
			// 检查下一个事件是否有未完成的抉择
			const hasUncompletedChoice = () => {
				if (!nextEvent || !choiceData.length) return false;
				const matchingChoice = choiceData.find(choice => 
					choice.name === player.name && choice.year === nextEvent.start_year
				);
				return matchingChoice && !completedChoices.includes(matchingChoice.year);
			};
			
			if (hasUncompletedChoice()) {
				// 下一个事件有未完成的抉择，显示抉择但不前进
				const matchingChoice = choiceData.find(choice => 
					choice.name === player.name && choice.year === nextEvent.start_year
				);
				setCurrentChoice(matchingChoice);
				setShowChoice(true);
				setChoiceResult(null);
				setChoiceResultContent('');
				setPendingChoiceIndex(nextIndex);
			} else {
				// 没有抉择，正常前进并绘制弧线
				const currentEvent = sortedEvents[currentEventIndex];
				if (currentEvent && nextEvent) {
					const curvePath = computeCurvePath(
						[currentEvent.longitude, currentEvent.latitude],
						[nextEvent.longitude, nextEvent.latitude]
					);
					setLinePath(curvePath);
				}
				setCurrentEventIndex(nextIndex);
				setPendingChoiceIndex(-1); // 清除等待的抉择
			}
		}
	};

	// 上一步按钮处理（清除线）
	const handlePrev = () => {
		if (currentEventIndex > 0) {
			setLinePath(null);
			setCurrentEventIndex(prev => prev - 1);
			setPendingChoiceIndex(-1); // 清除等待的抉择
		}
	};

	// 回顾一生处理函数
	const handleReviewLife = () => {
		// 绘制所有轨迹线
		setShowAllLines(true);
		// 设置总结语
		const summary = generateSummaryText();
		setSummaryText(summary);
		setShowSummary(true);
		// 清除当前的单条弧线
		setLinePath(null);
	};

	// 生成总结语文本
	const generateSummaryText = () => {
		const birthYear = player.birthYear || 0;
		const deathYear = getDeathYear();
		const age = deathYear - birthYear;
		const era = player.era;
		
		const summaries = {
			'李白': `青莲谪仙，诗酒人生。从碎叶城到长江畔，六十二载岁月，留下千首诗篇。你曾“仰天大笑出门去”，也曾“举杯消愁愁更愁”。官场失意，山水寄情，最终醉月而逝，将浪漫主义推向巅峰。`,
			'李清照': `千古第一才女，婉约词宗。从明水闺秀到颠沛流离，七十一载春秋，见证两宋变迁。你既有“和羞走，倚门回首，却把青梅嗅”的少女情怀，也有“生当作人杰，死亦为鬼雄”的豪迈气概。词别是一家，易安永存。`,
			'苏轼': `东坡居士，全才文豪。从眉山少年到儋州老翁，六十六载浮沉，历经三度贬谪。你既能“大江东去”，亦能“明月几时有”。黄州惠州儋州，成就了你的文学功业，更成就了“一蓑烟雨任平生”的旷达人生。`
		};
		
		return summaries[player.name] || `${player.name}，${era}的杰出人物，${age}载人生，留下不朽篇章。`;
	};
	
	// 获取死亡年份（从传记中提取或估算）
	const getDeathYear = () => {
		const bio = player.biography?.birthDeath || '';
		const match = bio.match(/\d{4}.*?(\d{4})/);
		if (match && match[1]) {
			return parseInt(match[1]);
		}
		// 默认估算：出生年份+平均寿命
		return (player.birthYear || 0) + 70;
	};

	// 对话处理函数
	const toggleChat = () => {
		setShowChat(!showChat);
		if (!showChat) {
			// 初始化对话
			setChatMessages([
				{
					role: 'system',
					content: `你好！我是${player.name}，${player.era}的${player.name === '李清照' ? '女词人' : '诗人'}。有什么想和我聊的吗？`
				}
			]);
		}
	};

	const handleUserInputChange = (e) => {
		setUserInput(e.target.value);
	};

	const handleSendMessage = async () => {
		if (!userInput.trim() || isLoading) return;

		const userMessage = userInput.trim();
		setUserInput('');
		
		// 添加用户消息
		const newMessages = [...chatMessages, { role: 'user', content: userMessage }];
		setChatMessages(newMessages);
		setIsLoading(true);

		try {
			// 获取当前事件信息
			const currentEvent = sortedEvents[currentEventIndex];
			const currentYear = currentEvent?.start_year || player.birthYear;
			const currentPlace = currentEvent?.ancient_place || '未知地点';
			const currentState = currentEvent?.state || '未知状态';
			const currentAge = currentYear - (player.birthYear || 0);
			
			// 调用后端API（相对路径，由nginx代理）
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					character: player.name,
					message: userMessage,
					context: {
						currentYear,
						currentPlace,
						currentState,
						currentAge: currentAge > 0 ? currentAge : 0,
						era: player.era,
						birthYear: player.birthYear,
						biography: player.biography?.birthDeath || '',
						choiceDescription: currentChoice ? currentChoice.description : ''
					}
				})
			});

			if (!response.ok) {
				throw new Error(`请求失败: ${response.status}`);
			}

			const data = await response.json();
			
			// 添加AI回复
			setChatMessages(prev => [...prev, { 
				role: 'assistant', 
				content: data.response 
			}]);
		} catch (error) {
			console.error('对话错误:', error);
			setChatMessages(prev => [...prev, { 
				role: 'assistant', 
				content: `抱歉，我暂时无法回答。错误: ${error.message}` 
			}]);
		} finally {
			setIsLoading(false);
		}
	};

	// 处理Enter键发送
	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
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

		// 轨迹线将由单独的effect根据linePath绘制（弧形箭头）

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
					setLinePath(null);
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

	// 绘制弧形箭头（根据linePath）
	useEffect(() => {
		if (!isMapLoaded || !linePath) return;
		const AMap = amapRef.current;
		const map = mapInstanceRef.current;
		// 清除旧的曲线
		if (polylineRef.current) polylineRef.current.setMap(null);
		// 创建弧线（使用Polyline）
		const curve = new AMap.Polyline({
			path: linePath,
			showDir: true,
			strokeColor: "#8E2323",
			strokeOpacity: 0.6,
			strokeWeight: 5,
			lineJoin: 'round'
		});
		curve.setMap(map);
		polylineRef.current = curve;
	}, [isMapLoaded, linePath]);

	// 绘制所有轨迹线（回顾一生时显示完整路径）
	useEffect(() => {
		if (!isMapLoaded || !showAllLines || !sortedEvents.length) return;
		const AMap = amapRef.current;
		const map = mapInstanceRef.current;
		
		// 清除旧的曲线（包括单条弧线）
		if (polylineRef.current) polylineRef.current.setMap(null);
		
		// 创建完整的弧形轨迹线
		const fullPath = computeFullCurvePath();
		if (fullPath.length === 0) return;
		
		const polyline = new AMap.Polyline({
			path: fullPath,
			showDir: true,
			strokeColor: "#8E2323",
			strokeOpacity: 0.6,
			strokeWeight: 5,
			lineJoin: 'round'
		});
		polyline.setMap(map);
		polylineRef.current = polyline;
		
		// 调整地图视野以显示完整轨迹
		setTimeout(() => {
			if (fullPath.length > 0) {
				map.setFitView([polyline], false, [80, 80, 80, 80]);
			}
		}, 300);
	}, [isMapLoaded, showAllLines, sortedEvents, computeFullCurvePath]);

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
							
							<div style={{ textAlign: 'center', margin: '15px 0' }}>
								<button 
									className="btn-chinese"
									onClick={toggleChat}
									style={{
										padding: '8px 16px',
										fontSize: '0.9rem',
										background: '#8E2323',
										color: 'white',
										border: 'none',
										borderRadius: '4px',
										cursor: 'pointer'
									}}
								>
									与诗人对话
								</button>
							</div>
							
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
									<div className="choice-result-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
										{choiceResult === 'wrong' ? (
											<button className="btn-chinese" onClick={handleRetryChoice}>
												重新选择
											</button>
										) : (
											<button className="btn-chinese" onClick={handleContinue}>
												继续游戏
											</button>
										)}
										<button 
											className="btn-chinese"
											onClick={toggleChat}
											style={{
												background: '#8E2323',
												color: 'white',
												border: 'none',
												borderRadius: '4px',
												padding: '8px 16px',
												cursor: 'pointer'
											}}
										>
											与诗人对话
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* 左上角头像和角色信息 */}
			<div className="overlay-top-left" style={{position: 'absolute', zIndex: 999, padding: '0.8rem 1.2rem', background: 'rgba(255, 252, 240, 0.9)', border: '1px solid #c09553', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
				<div style={{position: 'relative', display: 'flex', alignItems: 'center', gap: '0.8rem'}}>
					<img src={getAvatarForEvent(sortedEvents[currentEventIndex])} alt={player.name} className="avatar" style={{width: '3rem', height: '3rem', objectFit: 'cover'}} />
					<div style={{display: 'flex', flexDirection: 'column'}}>
						<div className="character-name" style={{fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)'}}>{player.name}</div>
						<div className="character-era" style={{fontSize: '0.9rem', color: '#666'}}>{player.era}</div>
					</div>
					
					{/* 对话按钮 */}
					<button 
						className="btn-chinese"
						onClick={toggleChat}
						style={{
							marginLeft: '0.5rem',
							padding: '0.4rem 0.8rem',
							fontSize: '0.85rem',
							background: '#8E2323',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer'
						}}
					>
						{showChat ? '关闭对话' : '与诗人对话'}
					</button>
					
					{/* 诗作对话框 */}
					{showPoemDialog && (
						<div style={{
							position: 'absolute',
							left: 'calc(100% + 10px)',
							top: 0,
							width: '300px',
							background: 'rgba(255, 252, 240, 0.95)',
							border: '2px solid #c09553',
							borderRadius: '12px',
							padding: '12px',
							boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
							fontFamily: '"STSong", "SimSun", serif',
							fontSize: '0.95rem',
							lineHeight: 1.6,
							color: '#333',
							zIndex: 3001
						}}>
							{/* 对话框小三角 */}
							<div style={{
								position: 'absolute',
								left: '-10px',
								top: '20px',
								width: 0,
								height: 0,
								borderTop: '10px solid transparent',
								borderBottom: '10px solid transparent',
								borderRight: '10px solid #c09553'
							}} />
							<div style={{
								position: 'absolute',
								left: '-8px',
								top: '20px',
								width: 0,
								height: 0,
								borderTop: '10px solid transparent',
								borderBottom: '10px solid transparent',
								borderRight: '10px solid rgba(255, 252, 240, 0.95)'
							}} />
							

							<div style={{
								whiteSpace: 'pre-wrap',
								minHeight: '60px',
								textAlign: 'center'
							}}>
								{poemText}
							</div>
						</div>
					)}
					
					{/* 对话对话框 */}
					{showChat && (
						<div style={{
							position: 'absolute',
							left: 'calc(100% + 10px)',
							top: 0,
							width: '400px',
							height: '500px',
							background: 'rgba(255, 252, 240, 0.98)',
							border: '2px solid #8E2323',
							borderRadius: '12px',
							boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
							display: 'flex',
							flexDirection: 'column',
							zIndex: 3000,
							overflow: 'hidden'
						}}>
							{/* 对话框小三角 */}
							<div style={{
								position: 'absolute',
								left: '-10px',
								top: '30px',
								width: 0,
								height: 0,
								borderTop: '10px solid transparent',
								borderBottom: '10px solid transparent',
								borderRight: '10px solid #8E2323'
							}} />
							<div style={{
								position: 'absolute',
								left: '-8px',
								top: '30px',
								width: 0,
								height: 0,
								borderTop: '10px solid transparent',
								borderBottom: '10px solid transparent',
								borderRight: '10px solid rgba(255, 252, 240, 0.98)'
							}} />
							
							{/* 对话框标题 */}
							<div style={{
								padding: '12px 16px',
								background: '#8E2323',
								color: 'white',
								fontWeight: 'bold',
								fontSize: '1.1rem',
								borderBottom: '1px solid #c09553',
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center'
							}}>
								<span>与{player.name}对话</span>
								<button 
									onClick={toggleChat}
									style={{
										background: 'transparent',
										border: 'none',
										color: 'white',
										fontSize: '1.2rem',
										cursor: 'pointer'
									}}
								>
									×
								</button>
							</div>
							
							{/* 消息区域 */}
							<div style={{
								flex: 1,
								padding: '16px',
								overflowY: 'auto',
								fontFamily: '"STSong", "SimSun", serif',
								fontSize: '0.95rem',
								lineHeight: 1.6
							}}>
								{chatMessages.filter(msg => msg.role !== 'system').map((message, index) => (
									<div 
										key={index}
										style={{
											marginBottom: '12px',
											display: 'flex',
											flexDirection: 'column',
											alignItems: message.role === 'user' ? 'flex-end' : 'flex-start'
										}}
									>
										<div style={{
											maxWidth: '80%',
											padding: '10px 14px',
											borderRadius: message.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
											background: message.role === 'user' ? '#8E2323' : '#F7F3E8',
											color: message.role === 'user' ? 'white' : '#333',
											border: message.role === 'user' ? 'none' : '1px solid #c09553',
											whiteSpace: 'pre-wrap',
											wordBreak: 'break-word'
										}}>
											{message.content}
										</div>
										<div style={{
											fontSize: '0.8rem',
											color: '#666',
											marginTop: '4px',
											marginLeft: message.role === 'user' ? '0' : '10px',
											marginRight: message.role === 'user' ? '10px' : '0'
										}}>
											{message.role === 'user' ? '你' : player.name}
										</div>
									</div>
								))}
								
								{isLoading && (
									<div style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'flex-start',
										marginBottom: '12px'
									}}>
										<div style={{
											padding: '10px 14px',
											borderRadius: '12px 12px 12px 0',
											background: '#F7F3E8',
											border: '1px solid #c09553',
											color: '#333',
											display: 'flex',
											alignItems: 'center'
										}}>
											<div className="typing-indicator">
												<span></span>
												<span></span>
												<span></span>
											</div>
											<span style={{marginLeft: '8px'}}>思考中...</span>
										</div>
									</div>
								)}
							</div>
							
							{/* 输入区域 */}
							<div style={{
								padding: '12px 16px',
								borderTop: '1px solid #c09553',
								background: 'rgba(247, 243, 232, 0.9)'
							}}>
								<div style={{
									display: 'flex',
									gap: '8px'
								}}>
									<textarea
										value={userInput}
										onChange={handleUserInputChange}
										onKeyPress={handleKeyPress}
										placeholder={`向${player.name}提问...`}
										style={{
											flex: 1,
											padding: '10px 12px',
											border: '1px solid #c09553',
											borderRadius: '6px',
											fontFamily: '"STSong", "SimSun", serif',
											fontSize: '0.95rem',
											resize: 'none',
											minHeight: '50px',
											maxHeight: '100px',
											background: 'white'
										}}
									/>
									<button
										onClick={handleSendMessage}
										disabled={isLoading || !userInput.trim()}
										style={{
											padding: '10px 20px',
											background: userInput.trim() && !isLoading ? '#8E2323' : '#ccc',
											color: 'white',
											border: 'none',
											borderRadius: '6px',
											cursor: userInput.trim() && !isLoading ? 'pointer' : 'not-allowed',
											fontWeight: 'bold',
											alignSelf: 'flex-end'
										}}
									>
										发送
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>

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

				{/* 总结语显示 */}
				{showSummary && (
					<div className="summary-container" style={{
						marginTop: '1.5rem',
						padding: '1.5rem',
						background: 'rgba(255, 252, 240, 0.95)',
						border: '2px solid #c09553',
						borderRadius: '8px',
						boxShadow: '0 6px 20px rgba(0, 0, 0, 0.1)',
						fontFamily: '"STKaiti", "Kaiti", serif',
						fontSize: '1.1rem',
						lineHeight: 1.8,
						color: '#333',
						textAlign: 'center'
					}}>
						<div style={{
							fontSize: '1.3rem',
							fontWeight: 'bold',
							color: '#8E2323',
							marginBottom: '1rem',
							borderBottom: '2px solid #c09553',
							paddingBottom: '0.5rem'
						}}>
							人生总结
						</div>
						<div style={{ whiteSpace: 'pre-wrap' }}>
							{summaryText}
						</div>
					</div>
				)}
				
				{/* 按钮组 */}
				{!showSummary && (
					<div className="btn-group">
						<button
							className="nav-btn"
							onClick={handlePrev}
							disabled={currentEventIndex === 0}
						>
							上一步
						</button>
						{currentEventIndex === sortedEvents.length - 1 ? (
							<button
								className="nav-btn"
								onClick={handleReviewLife}
								style={{background: '#5D6266'}} // 不同颜色以示区别
							>
								回顾一生
							</button>
						) : (
							<button
								className="nav-btn"
								onClick={handleNext}
								disabled={currentEventIndex === sortedEvents.length - 1}
							>
								下一步
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default GameScreen;
