import React from 'react';
import '../styles/common.css';
import '../styles/StartScreen.css';

const StartScreen = ({ onStart }) => (
	<div className="screen-centered bg-light">
		<h1 className="title-main">历史模拟器</h1>
		<button className="btn btn-primary" onClick={onStart}>
			开始游戏
		</button>
	</div>
);

export default StartScreen;