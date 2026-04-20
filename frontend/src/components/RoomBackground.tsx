import React from 'react';
import forestImage from '../assets/forest.png';
import cityImage from '../assets/city.png';

interface RoomBackgroundProps {
  background: string;
}

const TopRoomBackground: React.FC = () => {
  return (
    <svg 
      className="room-3d-top" 
      viewBox="0 0 1000 500" 
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Back wall (top half) */}
      <line x1="200" y1="200" x2="800" y2="200" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="800" y1="200" x2="800" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="200" y1="200" x2="200" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      
      {/* Left wall (top half) */}
      <line x1="0" y1="0" x2="200" y2="200" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="200" y1="200" x2="200" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="0" y1="0" x2="0" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      
      {/* Right wall (top half) */}
      <line x1="1000" y1="0" x2="800" y2="200" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="800" y1="200" x2="800" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="1000" y1="0" x2="1000" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      
      {/* Ceiling - with solid fill to cover dividers */}
      <polygon 
        points="0,0 1000,0 800,200 200,200" 
        fill="#2d2d2d" 
        fillOpacity="0.95" 
        stroke="#4d4d4d" 
        strokeWidth="2"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      
      {/* Grid lines on ceiling - only outer edges */}
      <g className="grid-lines" stroke="#4a4a4a" strokeWidth="2" fill="none" strokeLinecap="butt">
        <line x1="0" y1="0" x2="1000" y2="0" />
        <line x1="200" y1="200" x2="0" y2="0" />
        <line x1="800" y1="200" x2="1000" y2="0" />
      </g>
    </svg>
  );
};

const BottomRoomBackground: React.FC = () => {
  return (
    <svg 
      className="room-3d-bottom" 
      viewBox="0 0 1000 500" 
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Back wall (bottom half) */}
      <line x1="800" y1="0" x2="800" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="200" y1="0" x2="200" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      
      {/* Left wall (bottom half) */}
      <line x1="200" y1="0" x2="200" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="0" y1="0" x2="0" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      
      {/* Right wall (bottom half) */}
      <line x1="800" y1="0" x2="800" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      <line x1="1000" y1="0" x2="1000" y2="500" stroke="#3d3d3d" strokeWidth="2" />
      
      {/* Grid lines on floor */}
      <g className="grid-lines" stroke="#4a4a4a" strokeWidth="2" fill="none" strokeLinecap="butt">
        {/* Horizontal lines */}
        <line x1="100" y1="400" x2="900" y2="400" />
        <line x1="0" y1="500" x2="1000" y2="500" />
        
        {/* Vertical lines */}
        <line x1="200" y1="300" x2="0" y2="500" />
        <line x1="500" y1="400" x2="500" y2="500" />
        <line x1="800" y1="300" x2="1000" y2="500" />
      </g>
    </svg>
  );
};

const RoomBackground: React.FC<RoomBackgroundProps> = ({ background }) => {
  const backgroundImage = background === 'city' ? cityImage : forestImage;

  return (
    <div className="room-background">
      {/* Background */}
      <img 
        src={backgroundImage} 
        alt={`${background} background`} 
        className="background" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center bottom',
          opacity: 0.3
        }}
      />

      {/* Wall overlay */}
      <div className="wall-overlay">
        <div className="wall-back" />
        <div className="wall-left" />
        <div className="wall-right" />
      </div>

      {/* Top half of the room */}
      <div className="room-top">
        <TopRoomBackground />
      </div>

      {/* Bottom half of the room */}
      <div className="room-bottom">
        <BottomRoomBackground />
      </div>

      {/* Floor - separate layer with higher z-index */}
      <div className="floor-layer">
        <svg 
          className="floor-svg" 
          viewBox="0 0 1000 500" 
          preserveAspectRatio="xMidYMid slice"
        >
          <polygon 
            points="200,250 800,250 1000,500 0,500" 
            fill="#2d2d2d" 
          />
        </svg>
      </div>
    </div>
  );
};

export default RoomBackground; 