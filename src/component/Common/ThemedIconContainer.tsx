import React from 'react';
import Box from '@mui/material/Box';

interface ThemedIconContainerProps {
  iconColor: string;
  size?: 'small' | 'medium';
  children: React.ReactNode;
}

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
};

const blendWithWhite = (hex: string, amount: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const blend = (c: number) => Math.round(c * amount + 255 * (1 - amount));
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
};

const sizeMap = {
  small: { box: '32px', radius: '6px' },
  medium: { box: '48px', radius: '10px' },
} as const;

const ThemedIconContainer: React.FC<ThemedIconContainerProps> = ({
  iconColor,
  size = 'medium',
  children,
}) => {
  const { box, radius } = sizeMap[size];
  const background = blendWithWhite(iconColor, 0.1);

  return (
    <Box
      sx={{
        width: box,
        height: box,
        background,
        borderRadius: radius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </Box>
  );
};

export default ThemedIconContainer;
