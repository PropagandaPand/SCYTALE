// The tree-shaken light Lottie player (no expression engine → runs under our strict CSP, which
// forbids 'unsafe-eval'). Same runtime API as the default export of 'lottie-web', so reuse its types.
declare module 'lottie-web/build/player/lottie_light' {
  import lottie from 'lottie-web';
  export default lottie;
}
