const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are configured
const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                           process.env.CLOUDINARY_API_KEY && 
                           process.env.CLOUDINARY_API_SECRET;

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary configured successfully');
} else {
  console.log('Cloudinary credentials not found in environment variables');
  console.log('Image uploads will be disabled');
}

module.exports = cloudinary; 