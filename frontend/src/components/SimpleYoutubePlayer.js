// Simple YouTube Player for testing
import React from 'react';

const SimpleYoutubePlayer = ({ videoId }) => {
  return (
    <div className="simple-youtube-player">
      <iframe 
        width="100%" 
        height="360" 
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen>
      </iframe>
    </div>
  );
};

export default SimpleYoutubePlayer;
