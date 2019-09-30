import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=IBM+Plex+Mono|Playfair+Display:900');

  html {
    font-family: ${props => props.theme.fonts.body};
    font-size: 62.5%; 
    -ms-text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
  }
  body {
    margin: 0;
    padding: 5.6rem 8rem 4.8rem;
    min-height:100vh;
    font: 400 ${props => props.theme.fontSizes.medium} ${props => props.theme.fonts.body};
    font-kerning: normal;
    color: ${props => props.theme.colors.text};
    border: 1.2rem solid ${props => props.theme.colors.backgroundLight};
    background: -moz-linear-gradient(126deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.backgroundAlt} 100%); /* ff3.6+ */
    background: -webkit-gradient(linear, left top, right bottom, color-stop(0%, ${props => props.theme.colors.background}), color-stop(100%, ${props => props.theme.colors.backgroundAlt})); /* safari4+,chrome */
    background: -webkit-linear-gradient(126deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.backgroundAlt} 100%); /* safari5.1+,chrome10+ */
    background: -o-linear-gradient(126deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.backgroundAlt} 100%); /* opera 11.10+ */
    background: -ms-linear-gradient(126deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.backgroundAlt} 100%); /* ie10+ */
    background: linear-gradient(126deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.backgroundAlt} 100%); /* w3c */
    filter: progid:DXImageTransform.Microsoft.gradient( startColorstr='${props => props.theme.colors.background}', endColorstr='${props => props.theme.colors.backgroundAlt}',GradientType=1 ); /* ie6-9 */
    scroll-behavior: smooth;    
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-feature-settings:  "kern" 1;
        -moz-font-feature-settings: "kern" 1;
          -o-font-feature-settings: "kern" 1;
            font-feature-settings:  "kern" 1;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    }
  ::selection {
    background: ${props => props.theme.colors.brand};
    color: #FFF;
  }  
  ::-moz-selection {
    background: ${props => props.theme.colors.brand};
    color: #FFF;
  }
  a {
    text-decoration: none;
  }
  ul {
    margin: 0 auto;
    list-style-type: none;
  }
  footer {
    font-family: ${props => props.theme.fonts.mono};
    font-size: ${props => props.theme.fontSizes.xsmall};
    color: ${props => props.theme.colors.secondary}
  }
  @media only screen and (max-width: 767px) {
    body {
      padding: 3.2rem;
    }
  }
`
export default GlobalStyle;