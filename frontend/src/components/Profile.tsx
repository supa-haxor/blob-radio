import React from 'react';
import { FaCog } from 'react-icons/fa';
import { useMySession } from '../store/MySessionStore';

interface ProfileProps {
  onEdit: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onEdit }) => {
  const { userName, selfColor } = useMySession();
  const name = userName || 'Anonymous';
  const color = selfColor || '#FFD700';

  return (
    <div
      className="profile"
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="profile-avatar" style={{ backgroundColor: color }}>
        <div className="eyes" />
      </div>
      <span className="profile-name">{name}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="profile-edit-button"
      >
        <FaCog />
      </button>
    </div>
  );
};

export default Profile;
