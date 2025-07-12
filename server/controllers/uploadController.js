const cloudinary = require('../config/cloudinary');

// Check if Cloudinary is properly configured
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

// Upload image to Cloudinary
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ 
        message: 'Image upload service is not configured. Please contact administrator.' 
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'connectsphere',
      width: 1000,
      crop: 'scale',
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    console.error('Image upload error:', err);
    
    // Handle specific Cloudinary errors
    if (err.message.includes('api_key') || err.message.includes('must supply')) {
      return res.status(503).json({ 
        message: 'Image upload service is not properly configured. Please contact administrator.' 
      });
    }
    
    res.status(500).json({ message: 'Image upload failed. Please try again.' });
  }
}; 