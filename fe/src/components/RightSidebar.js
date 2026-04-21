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

// 关系图组件
const RelationshipGraph = ({ relationships, centerName, width = 320, height = 280 }) => {
  if (!relationships || relationships.length === 0) {
    return null;
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.42; // 稍微增大半径，给文字更多空间
  const nodeRadius = 16; // 增大节点半径以容纳名字
  const centerNodeRadius = 20;

  const nodes = relationships.map((rel, index) => {
    const angle = (2 * Math.PI * index) / relationships.length;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return { ...rel, x, y, angle };
  });

  return (
    <div className="relationship-graph">
      <h4>人际关系图</h4>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* 连线与关系文本 */}
        {nodes.map((node, idx) => {
          const midX = (centerX + node.x) / 2;
          const midY = (centerY + node.y) / 2;
          // 计算连线角度，用于文本偏移和旋转
          const lineAngle = Math.atan2(node.y - centerY, node.x - centerX);
          let angleInDegrees = lineAngle * 180 / Math.PI;
          // 调整角度，确保文字不会倒置（-90°到90°范围内）
          if (angleInDegrees > 90) angleInDegrees -= 180;
          if (angleInDegrees < -90) angleInDegrees += 180;
          // 文本偏移距离
          const textOffset = 12;
          const textX = midX + textOffset * Math.cos(lineAngle + Math.PI / 2);
          const textY = midY + textOffset * Math.sin(lineAngle + Math.PI / 2);
          
          return (
            <g key={`line-group-${idx}`}>
              <line
                x1={centerX}
                y1={centerY}
                x2={node.x}
                y2={node.y}
                stroke="#8E2323"
                strokeWidth="2"
                strokeOpacity="0.6"
              />
              {/* 关系文本放在连线旁边，旋转与连线方向一致 */}
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                fill="#8E2323"
                fontSize="10"
                fontWeight="500"
                dy="0.3em"
                transform={`rotate(${angleInDegrees}, ${textX}, ${textY})`}
              >
                {node.relation}
              </text>
            </g>
          );
        })}
        
        {/* 中心节点 */}
        <circle
          cx={centerX}
          cy={centerY}
          r={centerNodeRadius}
          fill="#8E2323"
          stroke="#C09553"
          strokeWidth="2"
        />
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dy="0.3em"
          fill="#F7F3E8"
          fontSize={centerName.length > 3 ? "11" : "12"}
          fontWeight="bold"
        >
          {centerName}
        </text>
        
        {/* 周边节点 */}
        {nodes.map((node, idx) => {
          // 根据名字长度动态调整字体大小
          const nameLength = node.name.length;
          let fontSize = 10;
          if (nameLength > 3) fontSize = 9;
          if (nameLength > 5) fontSize = 8;
          if (nameLength > 7) fontSize = 7;
          
          return (
            <g key={`node-${idx}`}>
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill="#C09553"
                stroke="#8E2323"
                strokeWidth="2"
              />
              {/* 名字放在圆圈内，根据长度调整字体 */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dy="0.3em"
                fill="#F7F3E8"
                fontSize={fontSize}
                fontWeight="bold"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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
            <>
              <div className="event-content">
                <p style={{ color: textColor }}>{event.content}</p>
              </div>
              <RelationshipGraph 
                relationships={event.relationships}
                centerName={event.name}
                width={320}
                height={280}
              />
            </>
          ) : (
            <p>暂无事件数据</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;