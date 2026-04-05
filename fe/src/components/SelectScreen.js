import React from 'react';
import { CHARACTERS } from '../constants/characters';
import '../styles/common.css';
import '../styles/SelectScreen.css';

const SelectScreen = ({ onSelectCharacter }) => (
	<div className="screen-centered bg-gray">
		<h2 className="title-sub">选择目标角色</h2>
		<div className="card-container">
			{CHARACTERS.map(c => (
				<div
					key={c.id}
					className="character-card"
					onClick={() => onSelectCharacter(c)}
				>
					<h3 className="character-name">{c.name}</h3>
					<p className="character-era">{c.era}</p>
				</div>
			))}
		</div>
	</div>
);

export default SelectScreen;