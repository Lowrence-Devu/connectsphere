const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const auth = require('../middleware/auth');

// Create a group
router.post('/', auth, groupController.createGroup);
// Get all groups for the user
router.get('/', auth, groupController.getUserGroups);
// Add a member
router.post('/:groupId/add-member', auth, groupController.addMember);
// Remove a member
router.post('/:groupId/remove-member', auth, groupController.removeMember);
// Get group info
router.get('/:groupId', auth, groupController.getGroup);
// Send a group message
router.post('/:groupId/messages', auth, groupController.sendGroupMessage);
// Get all group messages
router.get('/:groupId/messages', auth, groupController.getGroupMessages);
// Edit group name (admin only)
router.patch('/:groupId/name', auth, groupController.editGroupName);
// Leave group (any member)
router.post('/:groupId/leave', auth, groupController.leaveGroup);
// Upload group avatar (admin only)
router.patch('/:groupId/avatar', auth, groupController.uploadGroupAvatar);

module.exports = router; 