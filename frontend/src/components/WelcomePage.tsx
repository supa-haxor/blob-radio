import React, { useState, useEffect } from 'react';
import forestImage from '../assets/forest.png';
import cityImage from '../assets/city.png';

interface WelcomePageProps {
  onComplete: (name: string, color: string, background: string) => void;
  isConnecting?: boolean;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onComplete, isConnecting = false }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [selectedBackground, setSelectedBackground] = useState('forest');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved preferences on component mount
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const savedColor = localStorage.getItem('userColor');
    const savedBackground = localStorage.getItem('background');
    
    if (savedName) setName(savedName);
    if (savedColor) setSelectedColor(savedColor);
    if (savedBackground) setSelectedBackground(savedBackground);
  }, []);

  const colors = [
    { name: 'Coral Red', value: '#EF5350' },
    { name: 'Ocean Blue', value: '#42A5F5' },
    { name: 'Emerald', value: '#66BB6A' },
    { name: 'Toxic Purple', value: '#E040FB' },
    { name: 'Golden Yellow', value: '#FFCA28' },
    { name: 'Charcoal', value: '#616161' },
    { name: 'Ivory', value: '#FAFAFA' },
    { name: 'Burnt Orange', value: '#FF7043' },
    { name: 'Toxic Blue', value: '#7C4DFF' },
    { name: 'Powder Blue', value: '#B0E0E6' }
  ];

  const backgrounds = [
    { name: 'Forest', value: 'forest', image: forestImage },
    { name: 'City', value: 'city', image: cityImage }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a name');
      return;
    }
    
    setIsSubmitting(true);
    
    // Save preferences to localStorage
    localStorage.setItem('userName', name.trim());
    localStorage.setItem('userColor', selectedColor);
    localStorage.setItem('background', selectedBackground);
    
    onComplete(name.trim(), selectedColor, selectedBackground);
  };

  const isLoading = isSubmitting || isConnecting;

  return (
    <div className="welcome-page">
      <div className="welcome-container">
        <h1 className="welcome-title">Welcome to Blob Radio!</h1>
        <form onSubmit={handleSubmit} className="welcome-form">
          <div className="form-group">
            <label htmlFor="name">Choose your name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              className="comic-input"
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          
          <div className="form-group">
            <label>Pick your color:</label>
            <div className="color-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, 1fr)', 
              gap: '8px',
              marginTop: '8px'
            }}>
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: color.value,
                    width: '100%',
                    aspectRatio: '1',
                    border: '2px solid transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: '0'
                  }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Choose your background:</label>
            <div className="background-grid" style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '8px',
              marginTop: '8px'
            }}>
              {backgrounds.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  className={`background-option ${selectedBackground === bg.value ? 'selected' : ''}`}
                  style={{ 
                    backgroundImage: `url(${bg.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    width: '100%',
                    aspectRatio: '16/9',
                    border: '2px solid transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    padding: '0',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => setSelectedBackground(bg.value)}
                  title={bg.name}
                >
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'Comic Sans MS, cursive',
                    fontSize: '14px',
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)'
                  }}>
                    {bg.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="comic-button"
            disabled={isLoading}
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Connecting...' : 'Enter Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomePage; 