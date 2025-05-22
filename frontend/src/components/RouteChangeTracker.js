// RouteChangeTracker.js
// This component tracks route changes and triggers the PageLoader during navigation

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const RouteChangeTracker = ({ onRouteChange }) => {
  const location = useLocation();

  useEffect(() => {
    // Notify parent component that route has changed
    onRouteChange(location.pathname);
    
  }, [location.pathname, onRouteChange]);

  return null; // This component doesn't render anything
};

export default RouteChangeTracker;
