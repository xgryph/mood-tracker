export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 }
        }
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out'
      }
    }
  },
  plugins: []
};
