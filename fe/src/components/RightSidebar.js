import React, { useState } from 'react';
import '../styles/RightSidebar.css';

const RightSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`right-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="sidebar-handle">
        <span className="handle-icon">≡</span>
      </div>
      <div className="sidebar-content">
        <div className={`sidebar-panel ${isExpanded ? 'visible' : 'hidden'}`}>
          <h3>侧边栏</h3>
          <p>此处内容待填充</p>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;