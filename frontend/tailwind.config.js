/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        paper: "#FFFDF5",
        butter: "#FFD43B",
        mint: "#B8F2D0",
        coral: "#FF7A70",
        sky: "#9DD9FF",
      },
      borderWidth: {
        3: "3px",
        4: "4px",
      },
      boxShadow: {
        brutal: "4px 4px 0px #111111",
        "brutal-sm": "3px 3px 0px #111111",
        "brutal-lg": "7px 7px 0px #111111",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
