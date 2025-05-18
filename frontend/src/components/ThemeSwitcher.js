import React, { useState, useEffect } from 'react';
import './ThemeSwitcher.css';

function ThemeSwitcher() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    // Check if user has a theme preference in localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    // Apply theme
    document.body.classList.toggle('light-theme', !isDarkMode);
    document.body.classList.toggle('dark-theme', isDarkMode);
    
    // Save preference
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="theme-switcher">
      <button 
        onClick={toggleTheme}
        className={`theme-toggle-btn ${isDarkMode ? 'dark' : 'light'}`}
        aria-label="Toggle theme"
        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      >
        <img 
          src={`${process.env.PUBLIC_URL}/assets/images/welcome/theme-icon.svg`} 
          alt="Theme" 
          className="theme-icon" 
        />
        <span className="theme-label">{isDarkMode ? 'Dark' : 'Light'}</span>
      </button>
    </div>
  );
}

export default ThemeSwitcher;
