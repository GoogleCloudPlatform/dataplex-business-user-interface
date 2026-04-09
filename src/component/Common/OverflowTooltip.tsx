import React, { useState } from 'react';
import { Tooltip } from '@mui/material';

interface OverflowTooltipProps {
  text: string;
  children: React.ReactElement<{
    onMouseEnter?: React.MouseEventHandler<HTMLElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  }>;
}

const OverflowTooltip: React.FC<OverflowTooltipProps> = ({ text, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    setShowTooltip(e.currentTarget.scrollWidth > e.currentTarget.clientWidth);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <Tooltip
      title={showTooltip ? text : ''}
      slotProps={{
        popper: {
          modifiers: [{ name: 'offset', options: { offset: [0, -8] } }],
        },
      }}
    >
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
    </Tooltip>
  );
};

export default OverflowTooltip;
