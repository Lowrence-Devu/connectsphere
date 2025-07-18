import React, { useEffect, useRef } from 'react';

const CallModal = ({
  show,
  type, // 'voice' or 'video'
  localStream,
  remoteStream,
  onEnd,
  onMute,
  muted,
  incoming,
  onAccept,
  onDecline,
  username
}) => {
  const localVideo = useRef();
  const remoteVideo = useRef();

  useEffect(() => {
    if (localVideo.current && localStream) {
      localVideo.current.srcObject = localStream;
    }
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full flex flex-col items-center animate-fade-in-up">
        <h2 className="text-xl font-bold mb-2">{incoming ? 'Incoming' : 'In'} {type === 'video' ? 'Video' : 'Voice'} Call</h2>
        <div className="mb-4 text-blue-600 font-semibold">{username}</div>
        {type === 'video' && (
          <div className="flex gap-2 mb-4">
            <video ref={localVideo} autoPlay muted className="w-32 h-32 rounded-lg bg-black" />
            <video ref={remoteVideo} autoPlay className="w-32 h-32 rounded-lg bg-black" />
          </div>
        )}
        {type === 'voice' && (
          <div className="mb-4">
            <audio ref={remoteVideo} autoPlay />
            <audio ref={localVideo} autoPlay muted />
            <div className="text-gray-500">Voice only</div>
          </div>
        )}
        <div className="flex gap-4 mt-4">
          {incoming ? (
            <>
              <button onClick={onAccept} className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600">Accept</button>
              <button onClick={onDecline} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600">Decline</button>
            </>
          ) : (
            <>
              <button onClick={onMute} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600">
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={onEnd} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600">End Call</button>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(16px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.4s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
};

export default CallModal; 