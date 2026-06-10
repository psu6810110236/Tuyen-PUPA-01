/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // ใช้ Plus Jakarta Sans สำหรับ Headlines และ Inter สำหรับ Body
        heading: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      colors: {
        // Cool Indigo-Blue — Elegant Palette
        primary: {
          DEFAULT: "#5C7CFA",
          foreground: "#2B4ACB",
          fixed: "#8DA4FC",
        },
        secondary: {
          DEFAULT: "#748FFC",
          foreground: "#ffffff",
        },
        surface: {
          DEFAULT: "#ffffff",
          dim: "#E9ECEF",
          bright: "#F8F9FA",
          tint: "#364FC7",
        },
        background: {
          DEFAULT: "#F5F7FB",
          agent: "#F0F2F8",
        },
        outline: {
          DEFAULT: "#E5E8EE",
          variant: "#C8CDD8",
        },
        accent: {
          green: "#C3FAE8",
          orange: "#FFF4E6",
          red: "#FFF0F0",
        }
      },
      boxShadow: {
        'soft-blue': '0px 8px 32px rgba(92, 124, 250, 0.10), 0px 2px 8px rgba(26, 31, 54, 0.04)',
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",   // 24px สำหรับการ์ดมาตรฐาน
        '2xl': "1rem",  // 16px ตาม spec ของ Standard Cards
        '3xl': "1.5rem", // 24px สำหรับ Primary Action Buttons
        full: "9999px", // สำหรับ Upload FAB และ Pill shapes
      },
      spacing: {
        base: "8px",
        'container-padding': "24px",
        gutter: "16px",
        'app-bar-height': "72px",
      },
      borderWidth: {
        '2': '2px', // บังคับใช้ขอบ 2px ตาม Design System
      }
    },
  },
  plugins: [],
};
export default config;
