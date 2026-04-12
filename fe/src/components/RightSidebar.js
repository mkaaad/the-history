import React, { useState, useEffect } from 'react';
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

// 检查是否为电脑端（宽度大于768px）
const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 768;
};

const RightSidebar = ({ event }) => {
  // 电脑端默认展开并固定，移动端默认折叠
  const [isExpanded, setIsExpanded] = useState(isDesktop());
  const [isPinned, setIsPinned] = useState(isDesktop());
  const isPinnedRef = React.useRef(isPinned);
  
  // 获取颜色值
  const textColor = event?.color ? getColorFromName(event.color) : '#3b82f6';

  // 同步isPinned到ref
  useEffect(() => {
    isPinnedRef.current = isPinned;
  }, [isPinned]);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const desktop = isDesktop();
      // 如果未固定，根据窗口大小更新状态
      if (!isPinnedRef.current) {
        setIsExpanded(desktop);
        setIsPinned(desktop);
      } else {
        // 如果已固定，确保展开
        setIsExpanded(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // 初始更新一次
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // 空依赖，使用ref获取最新状态

  // 切换固定状态
  const togglePin = (e) => {
    e.stopPropagation(); // 防止触发父元素的鼠标事件
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    isPinnedRef.current = newPinned; // 更新ref
    // 如果固定，确保展开
    if (newPinned) {
      setIsExpanded(true);
    } else {
      // 如果取消固定，根据当前窗口大小决定是否展开
      setIsExpanded(isDesktop());
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