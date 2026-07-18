export const colors = {
  mainBlue: 'rgb(46,190,216)',
  // Darker, AA-compliant derivative of mainBlue for use as TEXT/LINK color
  // on light backgrounds. mainBlue itself is only ~2.1:1 on white and fails
  // WCAG AA for text (needs >=4.5:1), so it must never be used for text/links
  // in light mode. This value (#0E7C90) is ~4.88:1 on white and is safe for
  // normal-size text and links. It is NOT a replacement for mainBlue on large
  // surfaces/buttons - those can keep using the brighter mainBlue.
  mainBlueAccessibleText: '#0E7C90',
  bgBlue: 'rgba(46,190,216,0.35)',
  lessLightLightGray: 'rgb(200,200,200)',
  bgGreen: 'rgb(196,214,118)',
  lighterBlueGray: 'rgb(70,106,134)',
  bgDarkBlue: 'rgb(27,41,51)',
  almostBlack: 'rgb(25,25,25)',
  transparentAlmostBlack: 'rgba(25,25,25,0.5)',
  darkGrey: 'rgb(63,63,63)',
  white: '#FFFFFF',
  lightGray: '#D3D3D3',
  // Additional colors for video and Bible components
  primary: 'rgb(46,190,216)', // Use mainBlue as primary
  lightGrey: '#D3D3D3', // Alias for lightGray
  mediumGrey: 'rgb(100,100,100)',
  black: '#000000',
};

