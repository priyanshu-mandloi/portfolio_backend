import prisma from "../lib/prisma.js";
import validator from "validator";

// Create a new message
export const createMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    const newMessage = await prisma.message.create({
      data: { name, email, message },
    });

    return res.status(201).json({ message: "Message sent successfully", data: newMessage });
  } catch (err) {
    console.error("Create message error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Get all messages (admin only)
export const getMessages = async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Delete a message by ID (admin only)
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.message.delete({ where: { id } });
    return res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ message: "Failed to delete message" });
  }
};
