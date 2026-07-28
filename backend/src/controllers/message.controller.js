const crypto = require('crypto');
const { Op } = require('sequelize');
const { Message, User } = require('../models');
const ApiError = require('../utils/ApiError');

const SUPPORT_BOT_EMAIL = 'support.bot@hospital-platform.local';

const getSupportBot = async () => {
  const [bot] = await User.findOrCreate({
    where: { email: SUPPORT_BOT_EMAIL },
    defaults: {
      firstName: 'Care',
      lastName: 'Support Bot',
      email: SUPPORT_BOT_EMAIL,
      phone: null,
      role: 'admin',
      passwordHash: crypto.randomUUID(),
      isActive: true,
    },
  });

  return bot;
};

const buildStructuredBody = ({ body, category, attachment, isBroadcast = false }) => {
  if (!category && !attachment && !isBroadcast) return body;

  return JSON.stringify({
    text: body,
    category: category || 'general',
    attachment: attachment || null,
    isBroadcast,
  });
};

const buildSupportReply = (body, category) => {
  const text = String(body || '').toLowerCase();

  if (text.includes('emergency') || text.includes('chest pain') || text.includes('difficulty breathing')) {
    return {
      category: 'urgent_response',
      body:
        'This chat is not for emergencies. If you have severe symptoms, call emergency services or go to the nearest emergency department now.',
    };
  }

  if (category === 'billing' || text.includes('bill') || text.includes('invoice') || text.includes('charge')) {
    return {
      category: 'billing_support',
      body:
        'Billing support received your question. A team member will review your account and respond here as soon as possible.',
    };
  }

  if (category === 'pharmacy' || text.includes('refill') || text.includes('medication') || text.includes('prescription')) {
    return {
      category: 'pharmacy_support',
      body:
        'Pharmacy support has your question. Please include the medication name if you need a refill or clarification, and a team member will reply here.',
    };
  }

  if (category === 'triage' || text.includes('symptom') || text.includes('pain') || text.includes('fever')) {
    return {
      category: 'triage_support',
      body:
        'Thanks for the question. A support clinician will review this and respond here. If your symptoms worsen quickly, seek urgent care.',
    };
  }

  if (category === 'follow_up' || text.includes('follow up') || text.includes('follow-up')) {
    return {
      category: 'follow_up_support',
      body:
        'Your follow-up question has been received. The support team will review it and reply here shortly.',
    };
  }

  return {
    category: 'support_response',
    body:
      'Thanks for reaching out. The support team has received your message and will reply here as soon as possible.',
  };
};

// POST /api/messages
const sendMessage = async (req, res) => {
  const { body, category, attachment } = req.body;
  const supportBot = await getSupportBot();

  const message = await Message.create({
    senderId: req.user.id,
    recipientId: supportBot.id,
    body: buildStructuredBody({ body, category, attachment }),
  });

  const replyTemplate = buildSupportReply(body, category);
  const reply = await Message.create({
    senderId: supportBot.id,
    recipientId: req.user.id,
    body: buildStructuredBody({
      body: replyTemplate.body,
      category: replyTemplate.category,
    }),
  });

  const io = req.app.get('io');
  if (io) {
    io.to(`user:${req.user.id}`).emit('message:new', reply);
  }

  res.status(201).json({ success: true, data: { message, reply } });
};

// GET /api/messages/thread  - conversation between current user and support bot
const getThread = async (req, res) => {
  const supportBot = await getSupportBot();

  const messages = await Message.findAll({
    where: {
      [Op.or]: [
        { senderId: req.user.id, recipientId: supportBot.id },
        { senderId: supportBot.id, recipientId: req.user.id },
      ],
    },
    order: [['createdAt', 'ASC']],
  });

  res.json({ success: true, data: messages });
};

// GET /api/messages/inbox - return the support conversation summary
const getInbox = async (req, res) => {
  const supportBot = await getSupportBot();
  const latestMessage = await Message.findOne({
    where: {
      [Op.or]: [
        { senderId: req.user.id, recipientId: supportBot.id },
        { senderId: supportBot.id, recipientId: req.user.id },
      ],
    },
    order: [['createdAt', 'DESC']],
  });

  res.json(
    {
      success: true,
      data: latestMessage ? [latestMessage] : [],
    }
  );
};

// GET /api/messages/unread-count
const getUnreadCount = async (req, res) => {
  const supportBot = await getSupportBot();
  const count = await Message.count({
    where: {
      recipientId: req.user.id,
      senderId: supportBot.id,
      readAt: null,
    },
  });
  res.json({ success: true, data: { count } });
};

// PATCH /api/messages/thread/read
const markThreadAsRead = async (req, res) => {
  const supportBot = await getSupportBot();
  const [updatedCount] = await Message.update(
    { readAt: new Date() },
    {
      where: {
        senderId: supportBot.id,
        recipientId: req.user.id,
        readAt: null,
      },
    }
  );
  res.json({ success: true, data: { updatedCount } });
};

// PATCH /api/messages/:id/read
const markAsRead = async (req, res) => {
  const message = await Message.findByPk(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found');
  if (message.recipientId !== req.user.id) {
    throw new ApiError(403, 'You cannot mark this message as read');
  }
  message.readAt = new Date();
  await message.save();
  res.json({ success: true, data: message });
};

module.exports = {
  sendMessage,
  getThread,
  getInbox,
  getUnreadCount,
  markThreadAsRead,
  markAsRead,
};
