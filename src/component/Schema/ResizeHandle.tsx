import React, { useState } from 'react';

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isActive: boolean;
  darkMode: boolean;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({ onMouseDown, isActive, darkMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getLineColor = () => {
    if (isActive) return darkMode ? '#8ab4f8' : '#1a73e8';
    if (isHovered) return darkMode ? '#3c4043' : '#DADCE0';
    return 'transparent';
  };

  return (
    <div
      data-testid="resize-handle"
      onMouseDown={onMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '6px',
        cursor: 'col-resize',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '2px',
          height: '60%',
          backgroundColor: getLineColor(),
          borderRadius: '1px',
          transition: isActive ? 'none' : 'background-color 0.15s',
        }}
      />
    </div>
  );
};

export default ResizeHandle;
