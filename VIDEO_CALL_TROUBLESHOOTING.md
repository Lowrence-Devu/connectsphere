# Video Call Troubleshooting Guide

## Common Issues and Solutions

### 1. Users Can't Hear Each Other

**Symptoms:**
- Call connects but no audio
- One user can hear, other can't
- Audio works for one user but not the other

**Solutions:**

#### Check Browser Permissions
```javascript
// Check if microphone permission is granted
navigator.permissions.query({ name: 'microphone' }).then(result => {
  console.log('Microphone permission:', result.state);
});
```

#### Verify Audio Stream
```javascript
// Check if audio tracks are enabled
const audioTracks = stream.getAudioTracks();
console.log('Audio tracks:', audioTracks.length);
console.log('Audio enabled:', audioTracks[0]?.enabled);
```

#### Check Audio Elements
- Ensure `<audio>` elements are properly created for voice calls
- Verify `autoPlay` and `muted` attributes are correct
- Local audio should be `muted`, remote audio should not be muted

### 2. Users Can't See Each Other

**Symptoms:**
- Video call connects but no video
- Black video screen
- Camera permission denied

**Solutions:**

#### Check Camera Permissions
```javascript
// Check camera permission
navigator.permissions.query({ name: 'camera' }).then(result => {
  console.log('Camera permission:', result.state);
});
```

#### Verify Video Stream
```javascript
// Check if video tracks are enabled
const videoTracks = stream.getVideoTracks();
console.log('Video tracks:', videoTracks.length);
console.log('Video enabled:', videoTracks[0]?.enabled);
```

#### Check Video Elements
- Ensure `<video>` elements have correct attributes
- Verify `autoPlay`, `playsInline`, and `muted` attributes
- Local video should be `muted`, remote video should not be muted

### 3. Connection Issues

**Symptoms:**
- Call doesn't connect
- Connection drops frequently
- Poor call quality

**Solutions:**

#### Check WebRTC Support
```javascript
// Verify WebRTC support
const hasWebRTC = !!(window.RTCPeerConnection && navigator.mediaDevices?.getUserMedia);
console.log('WebRTC supported:', hasWebRTC);
```

#### Check STUN Servers
```javascript
// Test STUN server connectivity
const testSTUN = async () => {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('STUN working:', event.candidate);
    }
  };
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    pc.addTrack(stream.getTracks()[0], stream);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
  } catch (err) {
    console.error('STUN test failed:', err);
  }
};
```

#### Check Network Connectivity
- Ensure both users have stable internet connections
- Check firewall settings
- Try different browsers

### 4. Signal Transfer Issues

**Symptoms:**
- Call requests not received
- Signals not exchanged properly
- ICE candidates not handled

**Solutions:**

#### Check Socket Connection
```javascript
// Verify socket connection
console.log('Socket connected:', socket.connected);
console.log('Socket ID:', socket.id);
```

#### Check Signal Events
```javascript
// Listen for signal events
socket.on('call:signal', (data) => {
  console.log('Signal received:', data);
});

socket.on('ice-candidate', (data) => {
  console.log('ICE candidate received:', data);
});
```

#### Verify User IDs
```javascript
// Check user IDs match
console.log('Current user:', user._id);
console.log('Active chat:', activeChat._id);
console.log('Incoming call from:', incomingCall?.from);
```

### 5. Browser-Specific Issues

#### Chrome
- Check `chrome://settings/content/microphone`
- Check `chrome://settings/content/camera`
- Enable "Allow" for the site

#### Firefox
- Check `about:preferences#privacy` > Permissions
- Allow microphone and camera access

#### Safari
- Check Safari > Preferences > Websites > Camera/Microphone
- Allow access for the site

#### Edge
- Check Settings > Cookies and site permissions > Camera/Microphone
- Allow access for the site

### 6. Mobile Issues

#### iOS Safari
- Limited WebRTC support
- May require HTTPS
- Check Settings > Safari > Camera/Microphone

#### Android Chrome
- Usually works well
- Check site permissions in Chrome settings

### 7. Debug Tools

#### Browser Console
```javascript
// Enable detailed logging
localStorage.setItem('debug', 'true');

// Check WebRTC stats
if (peer) {
  peer.getStats().then(stats => {
    stats.forEach(report => {
      console.log('WebRTC stats:', report);
    });
  });
}
```

#### Network Tab
- Check WebSocket connections
- Verify signal messages are sent/received
- Look for failed requests

#### Media Tab (Chrome)
- Check audio/video streams
- Verify track states
- Monitor bandwidth usage

### 8. Testing Steps

1. **Test Microphone**
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('Microphone working'))
  .catch(err => console.error('Microphone error:', err));
```

2. **Test Camera**
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('Camera working'))
  .catch(err => console.error('Camera error:', err));
```

3. **Test WebRTC**
```javascript
const pc = new RTCPeerConnection();
console.log('RTCPeerConnection created:', !!pc);
```

4. **Test Socket Connection**
```javascript
console.log('Socket connected:', socket.connected);
socket.emit('test', { message: 'test' });
```

### 9. Common Error Messages

#### "getUserMedia() not supported"
- Browser doesn't support WebRTC
- Try different browser

#### "Permission denied"
- User denied microphone/camera access
- Check browser permissions

#### "ICE connection failed"
- Network connectivity issues
- Firewall blocking WebRTC
- Try different network

#### "Peer connection failed"
- STUN server issues
- Network restrictions
- Try different STUN servers

### 10. Prevention Tips

1. **Always request permissions early**
2. **Handle errors gracefully**
3. **Provide clear user feedback**
4. **Test on multiple browsers**
5. **Use HTTPS in production**
6. **Monitor connection quality**
7. **Implement fallback mechanisms**

### 11. Emergency Fixes

#### Reset Permissions
```javascript
// Clear stored permissions (Chrome)
chrome.contentSettings.microphone.clear({});
chrome.contentSettings.camera.clear({});
```

#### Force Refresh
```javascript
// Clear all caches and reload
window.location.reload(true);
```

#### Alternative STUN Servers
```javascript
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];
```

## Quick Diagnostic Checklist

- [ ] Browser supports WebRTC
- [ ] Microphone permission granted
- [ ] Camera permission granted (for video calls)
- [ ] Socket connection established
- [ ] User IDs are correct
- [ ] Network connectivity stable
- [ ] No firewall blocking WebRTC
- [ ] Using HTTPS (for production)
- [ ] Audio/video elements properly configured
- [ ] Stream tracks are enabled