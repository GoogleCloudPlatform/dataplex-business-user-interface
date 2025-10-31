import { Typography } from '@mui/material';
//import './Tag.css';

/**
 * @file Tag.tsx
 * @description
 * This component renders a simple, styled "tag" or "badge" using a
 * Material-UI `Typography` component. It is used to display short pieces of
 * metadata, such as entry types or system names.
 *
 * @param {TagProps} props - The props for the component.
 * @param {string} props.text - The text content to be displayed inside the tag.
 * @param {React.CSSProperties} [props.css] - (Optional) Additional CSS
 * styles to override or extend the default tag styling.
 *
 * @returns {React.ReactElement} A React element rendering the styled
 * `Typography` component.
 */

interface TagProps {
  //handleClick: any | (() => void); // Function to handle search, can be any function type
  text: string; // text to be displayed on the button
  css?: React.CSSProperties; // Optional CSS properties for the button
}

const Tag: React.FC<TagProps> = ({ text, css}) => {
    return (<Typography className="capitalizeTag" component="span" style={
                {
                    background:"#C2E7FF", 
                    // color:"#004A77", 
                    // padding:"5px 10px", 
                    // borderRadius:"10px",
                    // fontSize:"12px",
                    // fontWeight:"600",
                    color: '#004A77',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    height: '24px',
                    fontSize: '12px',
                    fontWeight: '500',
                    fontFamily: 'sans-serif',
                    letterSpacing: '0.83%',
                    border: 'none',
                    ...css
                }
        }>
            {text}
        </Typography>) ;
}
export default Tag;