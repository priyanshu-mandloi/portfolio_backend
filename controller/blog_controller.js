import prisma from '../lib/prisma.js';

// CREATE BLOG
export const createBlog = async (req, res) => {
  try {
    const { title, content, topic } = req.body;
    const rawTags = req.body.tags;
    const isPublicRaw = req.body.isPublic;

    const contentHtml = content || '';

    const tagsArray = typeof rawTags === 'string'
      ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(rawTags)
        ? rawTags.map(t => t.trim()).filter(Boolean)
        : [];

    const isPublic =
      typeof isPublicRaw === 'string'
        ? isPublicRaw.toLowerCase() === 'true'
        : Boolean(isPublicRaw);

    const imageUrl = req.file?.path || ''; // Blog.image is required in schema

    const authorId = req.user?.id || req.userId;

    const blog = await prisma.blog.create({
      data: {
        title,
        content: contentHtml,
        contentHtml: contentHtml,
        topic,
        tags: tagsArray,
        isPublic,
        image: imageUrl,
        authorId,
      },
    });

    return res.status(201).json(blog);
  } catch (e) {
    console.error('createBlog error:', e);
    return res.status(500).json({ message: 'Failed', error: e.message });
  }
};

// GET ALL BLOGS
export const getAllBlogs = async (req, res) => {
  try {
    const { topic } = req.query;
    const userRole = req.user?.role;

    const isAdmin = userRole === 'ADMIN';

    const where = {
      ...(isAdmin ? {} : { isPublic: true }),
      ...(topic && { topic }),
    };

    const blogs = await prisma.blog.findMany({
      where,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error });
  }
};


// GET BLOG BY ID
export const getBlogById = async (req, res) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: {
        comments: { include: { user: { select: { username: true, avatarUrl: true } } } },
        likes: true,
        author: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

if (!blog.isPublic && req.user?.id !== blog.authorId && req.user?.role !== 'ADMIN') {
  return res.status(403).json({ message: 'Unauthorized access' });
}


    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving blog', error });
  }
};

// UPDATE BLOG
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure only author or admin can update
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Blog not found' });
    if (req.user?.id !== existing.authorId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const rawTags = req.body.tags;
    const tagsArray = typeof rawTags === 'string'
      ? rawTags.split(',').map(t => t.trim()).filter(Boolean)
      : Array.isArray(rawTags)
        ? rawTags.map(t => t.trim()).filter(Boolean)
        : existing.tags;

    const updated = await prisma.blog.update({
      where: { id },
      data: {
        title: req.body.title || existing.title,
        content: req.body.content || existing.content,
        contentHtml: req.body.content || existing.contentHtml,
        topic: req.body.topic || existing.topic,
        tags: tagsArray,
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic === 'true' : existing.isPublic,
        image: req.file?.path || existing.image,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error });
  }
};

// DELETE BLOG
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.blog.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Blog not found' });

    if (req.user?.id !== existing.authorId && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await prisma.blog.delete({ where: { id } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed', error });
  }
};

// LIKE BLOG
export const likeBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    // Prevent duplicate likes
    const existingLike = await prisma.like.findFirst({ where: { blogId, userId } });
    if (existingLike) {
      return res.status(400).json({ message: 'Already liked' });
    }

    const like = await prisma.like.create({ data: { blogId, userId } });
    res.json(like);
  } catch (error) {
    res.status(500).json({ message: 'Like failed', error });
  }
};

// COMMENT ON BLOG
export const commentOnBlog = async (req, res) => {
  try {
    const { content } = req.body;
    const blogId = req.params.id;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const comment = await prisma.comment.create({
      data: { content, blogId, userId },
      include: { user: { select: { username: true, avatarUrl: true } } },
    });

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Comment failed', error });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const commentId = req.params.commentId;
    const blogId = req.params.id; 
    const comment = await prisma.comment.findUnique({ 
      where: { id: commentId },
      include: { user: { select: { id: true, username: true } } }
    });

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }


    // Check authorization: user can delete their own comment, admin can delete any
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ message: 'Unauthorized: You can only delete your own comments' });
    }

    // Delete the comment
    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ message: 'Comment deleted successfully' });
    
  } catch (error) {
    res.status(500).json({ message: 'Delete comment failed', error: error.message });
  }
};