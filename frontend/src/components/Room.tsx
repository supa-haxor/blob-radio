import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Avatar as AvatarType, RoomState } from '../types/avatar';
import Avatar from './Avatar';

const Room = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomState, setRoomState] = useState<RoomState>({ avatars: {} });
  const [myAvatar, setMyAvatar] = useState<AvatarType>({
    id: 'local',
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    color: `hsl(${Math.random() * 360}, 70%, 50%)`
  });

  useEffect(() => {
    // Connect to socket server
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    // Handle connection
    newSocket.on('connect', () => {
      const socketAvatar: AvatarType = {
        id: newSocket.id!,
        x: myAvatar.x,
        y: myAvatar.y,
        color: myAvatar.color
      };
      setMyAvatar(socketAvatar);
      newSocket.emit('join', socketAvatar);
    });

    // Handle other users joining
    newSocket.on('userJoined', (avatar: AvatarType) => {
      setRoomState(prev => ({
        avatars: { ...prev.avatars, [avatar.id]: avatar }
      }));
    });

    // Handle other users leaving
    newSocket.on('userLeft', (userId: string) => {
      setRoomState(prev => {
        const newAvatars = { ...prev.avatars };
        delete newAvatars[userId];
        return { avatars: newAvatars };
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle room click to move avatar
  const handleRoomClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!socket) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newAvatar = {
      ...myAvatar,
      x,
      y
    };
    setMyAvatar(newAvatar);
    if (socket.connected) {
      socket.emit('move', newAvatar);
    }
  };

  // Handle other users moving
  useEffect(() => {
    if (!socket) return;

    socket.on('userMoved', (avatar: AvatarType) => {
      setRoomState(prev => ({
        avatars: { ...prev.avatars, [avatar.id]: avatar }
      }));
    });
  }, [socket]);

  return (
    <div 
      className="relative w-full h-screen bg-gray-900 overflow-hidden cursor-pointer"
      onClick={handleRoomClick}
    >
      {/* Render all avatars using Avatar component */}
      {Object.values(roomState.avatars).map(avatar => (
        <Avatar
          key={avatar.id}
          id={avatar.id}
          x={avatar.x}
          y={avatar.y}
          color={avatar.color}
          name="Anonymous"
        />
      ))}
      
      {/* Render my avatar using Avatar component */}
      <Avatar
        id={myAvatar.id}
        x={myAvatar.x}
        y={myAvatar.y}
        color={myAvatar.color}
        name="Me"
        isSelf={true}
      />
    </div>
  );
};

export default Room; 