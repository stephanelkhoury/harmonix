import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import './style/SessionTimer.css';

function SessionTimer({ onExpiringSoon }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);
  
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setTimeRemaining(null);
        return;
      }
      
      try {
        // Decode token to get expiration
        const decoded = jwtDecode(token);
        const expirationTime = decoded.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const remainingTime = expirationTime - currentTime;
        
        if (remainingTime <= 0) {
          setTimeRemaining(null);
          return;
        }
        
        // Convert remaining time to minutes and seconds
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        
        setTimeRemaining({ minutes, seconds, total: remainingTime });
        
        // Check if token is expiring soon (less than 5 minutes)
        if (remainingTime < 300000 && !isExpiringSoon) {
          setIsExpiringSoon(true);
          if (onExpiringSoon) {
            onExpiringSoon(remainingTime);
          }
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setTimeRemaining(null);
      }
    };
    
    // Check immediately and then every second
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 1000);
    
    return () => clearInterval(interval);
  }, [onExpiringSoon, isExpiringSoon]);
  
  if (!timeRemaining) {
    return null;
  }
  
  const { minutes, seconds } = timeRemaining;
  const displayClass = minutes < 5 ? 'session-timer expiring' : 'session-timer';
  
  return (
    <div className={displayClass}>
      <span>Session expires in: </span>
      <span className="timer-value">
        {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      </span>
    </div>
  );
}

export default SessionTimer;
