import React, { useState } from 'react';
import { CHARACTERS } from '../constants/characters';
import '../styles/common.css';
import '../styles/SelectScreen.css';

const SelectScreen = ({ onSelectCharacter }) => {
	const [flippedCard, setFlippedCard] = useState(null);
	
	// 传记字段映射
	const biographyFields = [
		{ key: 'birthDeath', label: '生卒年' },
		{ key: 'birthPlace', label: '出生地' },
		{ key: 'ancestralHome', label: '祖籍' },
		{ key: 'familyBackground', label: '家世' },
		{ key: 'courtesyName', label: '字号' },
		{ key: 'examinationAchievement', label: '科举成就' },
		{ key: 'spouses', label: '配偶' },
		{ key: 'literaryAchievements', label: '文学成就' },
		{ key: 'representativeWorks', label: '代表作品' },
		{ key: 'literaryStatus', label: '文学地位' },
		{ key: 'posthumousTitle', label: '谥号' },
		{ key: 'burialPlace', label: '葬地' },
	];
	
	const handleInfoClick = (e, characterId) => {
		e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
		setFlippedCard(flippedCard === characterId ? null : characterId);
	};
	
	const handleCardClick = (e, character) => {
		// 无论卡片是否翻转状态，直接选择角色
		onSelectCharacter(character);
	};
	
	return (
		<div className="screen-centered bg-gray">
			<h2 className="title-sub">选择目标角色</h2>
			<div className="flip-card-container">
				{CHARACTERS.map(c => (
					<div
						key={c.id}
						className={`flip-card ${flippedCard === c.id ? 'flipped' : ''}`}
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
									{biographyFields.map(({ key, label }) => 
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
				))}
			</div>
		</div>
	);
};

export default SelectScreen;