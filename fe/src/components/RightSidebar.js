import React, { useState } from 'react';
import '../styles/RightSidebar.css';

// 颜色映射函数
const getColorFromName = (colorName) => {
  const colorMap = {
    '蓝色': '#3b82f6',
    '红色': '#ef4444',
    '绿色': '#10b981',
    '黄色': '#f59e0b',
    '紫色': '#8b5cf6',
    '青色': '#06b6d4',
    '橙色': '#f97316',
    '粉色': '#ec4899',
    '棕色': '#92400e',
    '灰色': '#6b7280',
    '黑色': '#000000'
  };
  
  // 如果找不到映射，返回默认颜色
  return colorMap[colorName] || '#3b82f6';
};

const RightSidebar = ({ event }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  // 获取颜色值
  const textColor = event?.color ? getColorFromName(event.color) : '#3b82f6';

  // 切换固定状态
  const togglePin = (e) => {
    e.stopPropagation(); // 防止触发父元素的鼠标事件
    setIsPinned(!isPinned);
    // 如果固定，确保展开
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  // 鼠标事件处理：只有在未固定时才响应
  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false);
    }
  };

  return (
    <div 
      className={`right-sidebar ${isExpanded ? 'expanded' : 'collapsed'} ${isPinned ? 'pinned' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-handle">
        <span className="handle-icon">≡</span>
        <button 
          className={`pin-button ${isPinned ? 'pinned' : ''}`}
          onClick={togglePin}
          title={isPinned ? "取消固定" : "固定展开"}
        >
          {isPinned ? "📌" : "📌"}
        </button>
      </div>
      <div className="sidebar-content">
        <div className={`sidebar-panel ${isExpanded ? 'visible' : 'hidden'}`}>
          <h3>事件详情</h3>
          {event ? (
            <div className="event-content">
              <p style={{ color: textColor }}>{event.content}</p>
            </div>
          ) : (
            <p>暂无事件数据</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;