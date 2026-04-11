import React, {useState, useEffect, useRef} from 'react';
import {CHARACTERS} from '../constants/characters';
import '../styles/common.css';
import '../styles/SelectScreen.css';

const SelectScreen = ({onSelectCharacter}) => {
	const [flippedCard, setFlippedCard] = useState(null);
	const [selectedCharacter, setSelectedCharacter] = useState(null);
	const [transitioning, setTransitioning] = useState(false);
	const [clonedCard, setClonedCard] = useState(null);
	const cardRefs = useRef([]);

	// 传记字段映射
	const biographyFields = [
		{key: 'birthDeath', label: '生卒年'},
		{key: 'birthPlace', label: '出生地'},
		{key: 'ancestralHome', label: '祖籍'},
		{key: 'familyBackground', label: '家世'},
		{key: 'courtesyName', label: '字号'},
		{key: 'examinationAchievement', label: '科举成就'},
		{key: 'spouses', label: '配偶'},
		{key: 'literaryAchievements', label: '文学成就'},
		{key: 'representativeWorks', label: '代表作品'},
		{key: 'literaryStatus', label: '文学地位'},
		{key: 'posthumousTitle', label: '谥号'},
		{key: 'burialPlace', label: '葬地'},
	];

	const handleInfoClick = (e, characterId) => {
		e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
		setFlippedCard(flippedCard === characterId ? null : characterId);
	};

	const handleCardClick = (e, character) => {
		// 获取卡片位置
		const index = CHARACTERS.findIndex(c => c.id === character.id);
		const cardElement = cardRefs.current[index];
		
		if (cardElement) {
			const cardRect = cardElement.getBoundingClientRect();
			const containerRect = cardElement.parentElement.getBoundingClientRect();
			
			// 计算卡片相对于容器的位置（用于绝对定位）
			const top = cardRect.top - containerRect.top;
			const left = cardRect.left - containerRect.left;
			const width = cardRect.width;
			const height = cardRect.height;
			
			// 计算卡片中心与容器中心的差值（用于移动动画）
			const cardCenterX = cardRect.left + cardRect.width / 2;
			const cardCenterY = cardRect.top + cardRect.height / 2;
			const containerCenterX = containerRect.left + containerRect.width / 2;
			const containerCenterY = containerRect.top + containerRect.height / 2;
			
			const moveX = containerCenterX - cardCenterX;
			const moveY = containerCenterY - cardCenterY;
			
			// 设置克隆卡片状态
			setClonedCard({
				character,
				position: { top, left },
				dimensions: { width, height },
				moveDistance: { x: moveX, y: moveY }
			});
		}
		
		// 开始过渡动画
		setSelectedCharacter(character.id);
		setTransitioning(true);
	};

	// 过渡动画完成后调用onSelectCharacter
	useEffect(() => {
		if (transitioning && selectedCharacter) {
			const timer = setTimeout(() => {
				const character = CHARACTERS.find(c => c.id === selectedCharacter);
				if (character) {
					onSelectCharacter(character);
				}
			}, 2000); // 动画持续2秒

			return () => clearTimeout(timer);
		}
	}, [transitioning, selectedCharacter, onSelectCharacter]);

	return (
		<div className={`screen-centered bg-gray ${transitioning ? 'transitioning' : ''}`}>
			<h2 className={`title-sub ${transitioning ? 'fade-out' : ''}`}>选择目标角色</h2>
			<div className={`flip-card-container ${transitioning ? 'transitioning' : ''}`}>
				{CHARACTERS.map((c, index) => {
					// 计算卡片位置索引：中间卡片为0，左边为-1，右边为1
					const cardIndex = index - 1; // 对于3个卡片：-1, 0, 1
					const isSelected = selectedCharacter === c.id;

					return (
						<div
							ref={el => cardRefs.current[index] = el}
							key={c.id}
							className={`flip-card ${flippedCard === c.id ? 'flipped' : ''} ${transitioning ? (isSelected ? 'original-hidden' : 'unselected-hide') : ''
								}`}
							style={transitioning && !isSelected ? {'--card-index': cardIndex} : {}}
						>
							{/* 卡片正面 */}
							<div className="flip-card-front">
								{/* 信息图标按钮 */}
								<button
									className="flip-icon-btn"
									onClick={(e) => handleInfoClick(e, c.id)}
								>
									<img src={c.markerIconSelected} alt="info" className="flip-icon-img" />
								</button>

								<img src={c.image} alt={c.name} className="flip-card-image" />
								<div className="flip-card-text-container">
									<h3 className="flip-card-name">{c.name}</h3>
									<p className="flip-card-era">{c.era}</p>
								</div>

								<div className="flip-card-action">
									<button
										className="btn-chinese"
										onClick={(e) => handleCardClick(e, c)}
									>
										选择此角色
									</button>
								</div>
							</div>

							{/* 卡片背面 */}
							<div className="flip-card-back">
								<div className="flip-card-back-content">
									<h4 className="biography-title">人物传记</h4>
									<div className="biography-fields">
										{biographyFields.map(({key, label}) =>
											c.biography[key] && (
												<div key={key} className="biography-field">
													<strong>{label}：</strong>
													<span>{c.biography[key]}</span>
												</div>
											)
										)}
									</div>

									<div className="flip-card-back-actions">
										<button
											className="flip-back-btn"
											onClick={(e) => handleInfoClick(e, c.id)}
										>
											返回正面
										</button>
										<button
											className="btn-chinese"
											onClick={(e) => handleCardClick(e, c)}
										>
											选择此角色
										</button>
									</div>
								</div>
							</div>
						</div>
					);
				})}
				{clonedCard && (
					<div className="flip-card-clone-container">
						<div
							className={`flip-card flip-card-clone ${flippedCard === clonedCard.character.id ? 'flipped' : ''}`}
							style={{
								top: clonedCard.position.top,
								left: clonedCard.position.left,
								width: clonedCard.dimensions.width,
								height: clonedCard.dimensions.height,
								'--move-x': `${clonedCard.moveDistance.x}px`,
								'--move-y': `${clonedCard.moveDistance.y}px`
							}}
						>
							{/* 卡片正面 */}
							<div className="flip-card-front">
								{/* 信息图标按钮（动画期间隐藏） */}
								<button
									className="flip-icon-btn"
								>
									<img src={clonedCard.character.markerIconSelected} alt="info" className="flip-icon-img" />
								</button>

								<img src={clonedCard.character.image} alt={clonedCard.character.name} className="flip-card-image" />
								<div className="flip-card-text-container">
									<h3 className="flip-card-name">{clonedCard.character.name}</h3>
									<p className="flip-card-era">{clonedCard.character.era}</p>
								</div>

								<div className="flip-card-action">
									<button
										className="btn-chinese"
									>
										选择此角色
									</button>
								</div>
							</div>

							{/* 卡片背面（隐藏返回正面按钮） */}
							<div className="flip-card-back">
								<div className="flip-card-back-content">
									<h4 className="biography-title">人物传记</h4>
									<div className="biography-fields">
										{biographyFields.map(({key, label}) =>
											clonedCard.character.biography[key] && (
												<div key={key} className="biography-field">
													<strong>{label}：</strong>
													<span>{clonedCard.character.biography[key]}</span>
												</div>
											)
										)}
									</div>

									<div className="flip-card-back-actions">
										{/* 返回正面按钮隐藏 */}
										<button
											className="flip-back-btn"
										>
											返回正面
										</button>
										<button
											className="btn-chinese"
										>
											选择此角色
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default SelectScreen;
