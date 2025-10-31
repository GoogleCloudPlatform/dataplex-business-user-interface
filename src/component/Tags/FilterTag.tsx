import React from 'react';
import { Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

/**
 * @file FilterTag.tsx
 * @description
 * This component renders a styled Material-UI `Button` that acts as a filter
 * tag. It displays text and can optionally include a "close" icon.
 *
 * When the button is clicked, it always triggers the `handleClick` prop.
 * If the `showCloseButton` prop is set to true, it also displays a `CloseIcon`
 * and will trigger the `handleClose` prop (in addition to `handleClick`) when
 * clicked.
 *
 * @param {FilterTagProps} props - The props for the component.
 * @param {function} props.handleClick - The function to be executed when the
 * tag (button) is clicked.
 * @param {function} [props.handleClose] - (Optional) The function to be
 * executed when the close icon is present and the button is clicked.
 * @param {string} props.text - The text to be displayed on the tag.
 * @param {React.CSSProperties} [props.css] - (Optional) Additional CSS styles
 * to be applied to the button.
 * @param {boolean} [props.showCloseButton=false] - (Optional) If true, a close
 * icon is displayed, and the `handleClose` function is enabled.
 *
 * @returns {React.ReactElement} A React element rendering the styled
 * `Button` component.
 */

interface FilterTagProps {
  handleClick: any | (() => void); // Function to handle search, can be any function type
  handleClose?: any | (() => void); // Function to handle close button click
  text: string; // text to be displayed on the button
  css?: React.CSSProperties; // Optional CSS properties for the button
  showCloseButton?: boolean; // Whether to show close button
}

const FilterTag: React.FC<FilterTagProps> = ({ handleClick, handleClose, text, css, showCloseButton = false}) => {
    return (
        <Button 
            onClick={()=>{
                if(showCloseButton){
                    handleClose();
                }
                console.log('btn close', text);
                handleClick();
            }} 
            style={{
                background:"#fff", 
                color:"#004A77", 
                padding:"8px 15px", 
                borderRadius:"20px",
                fontSize:"12px",
                fontWeight:"500",
                border:"1px solid #333",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                ...css
            }}
        >
            {showCloseButton && handleClose && (

                // <IconButton
                //     size="small"
                //     onClick={(e) => {
                //         e.stopPropagation();
                //         handleClose();
                //     }}
                //     style={{
                //         padding: "2px",
                //         color: "inherit",
                //         marginLeft: "-4px"
                //     }}
                // >
//                     <CloseIcon style={{ fontSize: "14px",  padding: "2px",color: "inherit",marginLeft: "-4px" }} />
                // </IconButton>
                <div
                    // onClick={(e) => {
                    //     console.log('div close', text);
                    //     e.stopPropagation();
                    //     handleClose();
                    // }}
                    style={{
                        padding: "2px",
                        color: "inherit",
                        marginLeft: "-4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                    <CloseIcon style={{ fontSize: "14px" }} />
                </div>
            )}
            {text}
        </Button>
    );
}
export default FilterTag;