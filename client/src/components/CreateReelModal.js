import React, { useState, useRef } from 'react';

const CreateReelModal = ({ onClose, onCreate, uploading, error }) => {
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [music, setMusic] = useState({ title: '', artist: '', url: '' });
  const [isPublic, setIsPublic] = useState(true);
  const [duration, setDuration] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setVideoPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Get video duration
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        setDuration(Math.round(video.duration));
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoFile) return;

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('caption', caption);
    formData.append('tags', tags);
    formData.append('duration', duration);
    formData.append('isPublic', isPublic);
    
    if (music.title) {
      formData.append('music', JSON.stringify(music));
    }

    await onCreate(formData);
    
    // Reset form
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setTags('');
    setMusic({ title: '', artist: '', url: '' });
    setIsPublic(true);
    setDuration(0);
    onClose();
  };

  const handleClose = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setCaption('');
    setTags('');
    setMusic({ title: '', artist: '', url: '' });
    setIsPublic(true);
    setDuration(0);
    onClose();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Reel</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Video
            </label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
              {videoPreview ? (
                <div className="space-y-2">
                  <video
                    src={videoPreview}
                    className="max-h-48 mx-auto rounded"
                    controls
                  />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Duration: {formatDuration(duration)}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Change Video
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Click to upload video
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    MP4, MOV, AVI up to 100MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Caption */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's your reel about?"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={3}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="funny, dance, music"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Music */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Music (Optional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={music.title}
                onChange={(e) => setMusic(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Song title"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={music.artist}
                onChange={(e) => setMusic(prev => ({ ...prev, artist: e.target.value }))}
                placeholder="Artist"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="url"
                value={music.url}
                onChange={(e) => setMusic(prev => ({ ...prev, url: e.target.value }))}
                placeholder="Music URL"
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Privacy */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              id="public-reel-toggle"
            />
            <label htmlFor="public-reel-toggle" className="text-sm text-gray-700 dark:text-gray-300">
              Public Reel
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!videoFile || uploading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {uploading ? 'Creating Reel...' : 'Create Reel'}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Reels are permanent and can be shared with the community
        </div>
      </div>
    </div>
  );
};

export default CreateReelModal; 