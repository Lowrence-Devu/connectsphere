#!/usr/bin/env node

// Script to update CORS configuration with new deployment URLs
// Run this after getting your new Vercel and Render URLs

const fs = require('fs');
const path = require('path');

console.log('🔧 CORS Configuration Updater');
console.log('==============================\n');

console.log('Please provide your new deployment URLs:');
console.log('1. Your new Vercel frontend URL (e.g., https://connectsphere-new.vercel.app)');
console.log('2. Your new Render backend URL (e.g., https://connectsphere-backend.onrender.com)');

console.log('\nAfter you get these URLs, update the server/server.js file with:');
console.log('- Add your new Vercel URL to the CORS origins array');
console.log('- Update the client .env files with the new URLs');

console.log('\n📝 Steps to complete:');
console.log('1. Deploy to Vercel and get the frontend URL');
console.log('2. Deploy to Render and get the backend URL');
console.log('3. Update server/server.js CORS origins');
console.log('4. Update client environment variables');
console.log('5. Redeploy both services');

console.log('\n🎯 Quick Commands:');
console.log('git add .');
console.log('git commit -m "Update CORS with new deployment URLs"');
console.log('git push origin main'); 