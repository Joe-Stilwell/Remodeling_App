/** @type {import('tailwindcss').Config} */
module.exports = {
  // 1. The "Eyes": Telling Tailwind where to look for your HTML
  content: [
  "./index.html",
  "./widgets/**/*.html",
  "./js/**/*.js",
  "./src/**/*.{html,js}"
],

  // 2. The "Brain": Defining your custom brand styles
  theme: {
    extend: {
      colors: {
        // Typography
        'ink-dark': '#003956',     
        'ink-light': '#E4EAF2',    
        'ink-muted': '#003956', 

        // Brand Blues
        'brand-primary': '#006496', 
        'brand-header': '#6F94B8',  
        'brand-tint': '#F4FCFF',    
        'brand-dark': '#003366',    

        // Action Palette
        'brand-orange': '#FF7936',  
        'brand-accent': '#FFBB99',  

        // Status
        'success': '#4ADE80',       
        'danger': '#EF4444',        

        // Surfaces
        'surface-white': '#FFFFFF',
        'border-slate': '#CBD5E1',
      },
      height: {
        'header-top': '70px',
        'header-bottom': '35px',
        'header-total': '105px',
      },
      boxShadow: {
        'soft-sm': '0 2px 4px rgba(0,0,0,0.05)',
        'soft-md': '0 10px 15px -3px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}