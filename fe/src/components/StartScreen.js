import React from 'react';
import '../styles/common.css';
import '../styles/StartScreen.css';

const StartScreen = ({onStart}) => (
	<div className="screen-centered bg-light">
		<h1 className="title-main">史·迹</h1>
		<button className="btn btn-primary" onClick={onStart}>
			开始体验
		</button>
		<h2 className="title-sub">在PC端获取最佳体验</h2>
	</div>
);

export default StartScreen;
