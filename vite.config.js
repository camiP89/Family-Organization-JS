// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html', // Your main application HTML file
        login: 'pages/login.html', // Add this line for your login page
        shopping: 'pages/shopping.html', // Add this line for your shopping page
        calendar: 'pages/calendar.html', // Add this line for your calendar page
        chores: 'pages/chores.html', // Add this line for your chores page
        // IMPORTANT: Add an entry (e.g., 'yourpage': 'pages/yourpage.html')
        // for EVERY OTHER HTML file inside your 'pages/' folder
        // that uses JavaScript modules or needs to be a separate page.
      },
    },
  },
  // You can add other Vite configurations here if needed in the future
});
