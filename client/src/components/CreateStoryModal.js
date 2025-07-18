import React, { useState } from 'react';

function CreateStoryModal({ onClose, onCreate, uploading, error }) {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('image/')) {
      setMediaType('image');
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    } else if (file.type.startsWith('video/')) {
      setMediaType('video');
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    } else {
      setMediaType(null);
      setMediaFile(null);
      setMediaPreview(null);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mediaFile) return;
    onCreate({ mediaFile, mediaType });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-xs sm:max-w-md relative transform transition-all duration-300 scale-95 opacity-0 animate-modal-in">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" onClick={onClose}>
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add Story</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image or Video</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {mediaPreview && (
              <div className="mt-3 relative">
                {mediaType === 'image' ? (
                  <img src={mediaPreview} alt="Preview" className="w-full rounded-lg object-cover max-h-60" />
                ) : (
                  <video src={mediaPreview} controls className="w-full rounded-lg max-h-60 bg-black" />
                )}
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-80"
                  onClick={handleRemoveMedia}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 disabled:opacity-60"
            disabled={!mediaFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Add to Story'}
          </button>
          {error && (
            <div className="text-red-500 text-sm text-center mt-2">{error}</div>
          )}
        </form>
      </div>
    </div>
  );
}

export default CreateStoryModal; 