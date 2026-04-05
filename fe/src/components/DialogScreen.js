import React from 'react';
import '../styles/common.css';
import '../styles/DialogScreen.css';

const DialogScreen = ({ onEnd, onBackToGame }) => (
	<div className="dialog-screen bg-dark">
		<h2 className="title-sub">历史事件抉择 (AI对话)</h2>
		<div className="dialog-content">
			<p style={{marginBottom: '1rem'}}><strong>系统/AI:</strong> 权臣当道，你决定上书直言，还是明哲保身？</p>
			<p style={{color: '#9ca3af', fontStyle: 'italic'}}>...此处为AI流式输出区域...</p>
		</div>
		<div className="dialog-actions">
			<button onClick={onEnd} className="btn btn-danger">直言极谏 (按历史进程 - 导致死亡)</button>
			<button onClick={onBackToGame} className="btn btn-primary" style={{flex: 1}}>明哲保身 (额外选择 - 返回)</button>
		</div>
	</div>
);

export default DialogScreen;