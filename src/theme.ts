import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    heading2Medium: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    heading2Medium?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    heading2Medium: true;
  }
}

const theme = createTheme({
  typography: {
    fontFamily: '"Google Sans Text", sans-serif',
    heading2Medium: {
      fontFamily: '"Google Sans", sans-serif',
    },
    // ... other variants
  },
});

export default theme;