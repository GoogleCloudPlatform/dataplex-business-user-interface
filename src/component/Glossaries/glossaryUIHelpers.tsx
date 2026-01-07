// glossaryUIHelpers.tsx
import GlossaryIcon from "../../assets/svg/glossary.svg";
import TermIcon from "../../assets/svg/glossary_term.svg";
import CategoryIcon from "../../assets/svg/glossary_category.svg";
import { type ItemType } from "./GlossaryDataType";

export const getIcon = (
  type: ItemType,
  fontSize: "small" | "medium" | "large" = "small"
) => {
  const sizeMap = {
    small: "1rem",
    medium: "1.5rem",
    large: "2.5rem",
  };

  const size = sizeMap[fontSize];

  const commonStyle = {
    width: size,
    height: size,
    flex: "0 0 auto",
    opacity: 1,
  };

  switch (type) {
    case "glossary":
      return <img src={GlossaryIcon} alt={"Glossary"} style={commonStyle} />;
    case "category":
      return <img src={CategoryIcon} alt={"Category"} style={commonStyle} />;
    case "term":
      return <img src={TermIcon} alt={"Term"} style={commonStyle} />;
    default:
      return <img src={TermIcon} alt={"Term"} style={commonStyle} />;
  }
};
