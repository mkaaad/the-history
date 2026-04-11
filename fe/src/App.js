import React, {useState} from 'react';
import './App.css';

// 导入组件
import StartScreen from './components/StartScreen';
import SelectScreen from './components/SelectScreen';
import GameScreen from './components/GameScreen';
import DialogScreen from './components/DialogScreen';
import EndScreen from './components/EndScreen';

export default function HistoricalGame() {
	const [currentView, setCurrentView] = useState('start');
	const [player, setPlayer] = useState(null);

	const handleStart = () => setCurrentView('select');
	const handleSelectCharacter = (selectedPlayer) => {
		setPlayer(selectedPlayer);
		setCurrentView('game');
	};
	const handleBackToSelect = () => setCurrentView('select');
	const handleManualTrigger = () => setCurrentView('dialog');
	const handleEnd = () => setCurrentView('end');
	const handleBackToGame = () => setCurrentView('game');
	const handleRestart = () => {
		setPlayer(null);
		setCurrentView('start');
	};

	return (
		<div className="app-container">
			{currentView === 'start' && <StartScreen onStart={handleStart} />}
			{currentView === 'select' && <SelectScreen onSelectCharacter={handleSelectCharacter} />}
			{currentView === 'game' && player && (
				<GameScreen
					player={player}
					onBackToSelect={handleBackToSelect}
					onManualTrigger={handleManualTrigger}
				/>
			)}
			{currentView === 'dialog' && (
				<DialogScreen
					onEnd={handleEnd}
					onBackToGame={handleBackToGame}
				/>
			)}
			{currentView === 'end' && player && (
				<EndScreen
					player={player}
					onRestart={handleRestart}
				/>
			)}
		</div>
	);
}
