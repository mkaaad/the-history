import React from 'react';
import '../styles/common.css';
import '../styles/EndScreen.css';

const EndScreen = ({ player, onRestart }) => (
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
				onClick={onRestart}
				className="btn btn-outline"
				style={{marginTop: '3rem'}}
			>
				重新开始，更换人物
			</button>
		</div>
	</div>
);

export default EndScreen;