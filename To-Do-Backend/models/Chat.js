const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SharedGroup',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage',
        default: null
    },
    edited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient querying
chatMessageSchema.index({ groupId: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);