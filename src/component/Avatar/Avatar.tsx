import React from 'react';

/**
 * @file Avatar.tsx
 * @summary A simple React component that displays a circular avatar.
 *
 * @description
 * This component renders a circular avatar displaying the first initial (uppercased)
 * of a given `text` string.
 *
 * It uses a simple hash function (`generateAvatarColor`) to consistently
 * map the input `text` to one of several predefined color pairs
 * (background and text color). This ensures that the same text
 * (e.g., the same user name) will always display the same color avatar.
 *
 * @param {object} props - The props for the Avatar component.
 * @param {string} props.text - The text string (e.g., a name) used to
 * generate the avatar's initial and color.
 *
 * @returns {JSX.Element} A styled `div` element representing the circular avatar.
 */

interface AvatarProps {
  text: string;
}
// Avatar component
const Avatar: React.FC<AvatarProps> = ({ text }) => {
  const firstChar = text.charAt(0).toUpperCase();
  const generateAvatarColor = (text: string) => {
    const colors = [
      { bg: '#E3F2FD', text: '#1565C0' }, // Light Blue
      { bg: '#F3E5F5', text: '#7B1FA2' }, // Light Purple
      { bg: '#E8F5E8', text: '#2E7D32' }, // Light Green
      { bg: '#FFF3E0', text: '#F57C00' }, // Light Orange
      { bg: '#FCE4EC', text: '#C2185B' }, // Light Pink
      { bg: '#E0F2F1', text: '#00695C' }, // Light Teal
      { bg: '#F1F8E9', text: '#558B2F' }, // Light Lime
      { bg: '#FFF8E1', text: '#F9A825' }, // Light Yellow
      { bg: '#FFEBEE', text: '#D32F2F' }, // Light Red
      { bg: '#E8EAF6', text: '#303F9F' }, // Light Indigo
    ];
    
    // Simple hash function to get consistent color for same text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const { bg, text: textColor } = generateAvatarColor(text);

  const style: React.CSSProperties = {
    backgroundColor: bg,
    color: textColor,
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    marginRight: 12,
    flexShrink: 0
  };

  return <div style={style}>{firstChar}</div>;
};

export default Avatar;
