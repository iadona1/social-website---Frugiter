import { Router, Request, Response } from "express";
import pool from "../db.js";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const router = Router();

router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const auth = (req: any, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Not authorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };
    req.user = { userId: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

// Get all posts
router.get("/", auth, async (req: any, res: Response) => {
  try {
    const result = await pool.query(
      `
      SELECT
        p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
        u.id as user_id, u.display_name, u.username,
        pp.url as avatar_url,
        EXISTS(
          SELECT 1 FROM likes l
          WHERE l.post_id = p.id AND l.user_id = $1
        ) as liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      ORDER BY p.created_at DESC
      LIMIT 50
    `,
      [req.user.userId],
    );

    const posts = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url || "/assets/Frugiter-Icon-blue.jpg",
      content: row.content,
      imageUrl: row.image_url,
      likesCount: row.likes_count,
      commentsCount: row.comments_count,
      createdAt: row.created_at,
      liked: row.liked,
    }));

    res.json({ posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Create post
router.post(
  "/",
  auth,
  upload.single("image"),
  async (req: any, res: Response) => {
    const { content } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content?.trim() && !imageUrl) {
      return res.status(400).json({ error: "Post cannot be empty" });
    }

    try {
      const result = await pool.query(
        `
      INSERT INTO posts (user_id, content, image_url)
      VALUES ($1, $2, $3)
      RETURNING id, content, image_url, likes_count, comments_count, created_at
    `,
        [req.user.userId, content || "", imageUrl],
      );

      const userResult = await pool.query(
        `
      SELECT u.display_name, pp.url as avatar_url
      FROM users u
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE u.id = $1
    `,
        [req.user.userId],
      );

      const post = result.rows[0];
      const user = userResult.rows[0];

      res.status(201).json({
        post: {
          id: post.id,
          userId: req.user.userId,
          displayName: user.display_name,
          avatarUrl: user.avatar_url || "/assets/Frugiter-Icon-blue.jpg",
          content: post.content,
          imageUrl: post.image_url,
          likesCount: post.likes_count,
          commentsCount: post.comments_count,
          createdAt: post.created_at,
          liked: false,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
);

// Like / unlike post
router.post("/:id/like", auth, async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await pool.query(
      "SELECT id FROM likes WHERE post_id = $1 AND user_id = $2",
      [id, req.user.userId],
    );
    if (existing.rows.length > 0) {
      await pool.query(
        "DELETE FROM likes WHERE post_id = $1 AND user_id = $2",
        [id, req.user.userId],
      );
      await pool.query(
        "UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1",
        [id],
      );
    } else {
      await pool.query("INSERT INTO likes (post_id, user_id) VALUES ($1, $2)", [
        id,
        req.user.userId,
      ]);
      await pool.query(
        "UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1",
        [id],
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
  const postOwner = await pool.query(
    "SELECT user_id FROM posts WHERE id = $1",
    [id],
  );
  if (postOwner.rows[0]?.user_id !== req.user.userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, from_user_id, type, post_id)
     VALUES ($1, $2, 'like', $3)`,
      [postOwner.rows[0].user_id, req.user.userId, id],
    );
  }
});

// Delete post
router.delete("/:id", auth, async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const post = await pool.query("SELECT user_id FROM posts WHERE id = $1", [
      id,
    ]);
    if (post.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "Not your post" });
    }
    await pool.query("DELETE FROM posts WHERE id = $1", [id]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Get comments
router.get("/:id/comments", auth, async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT
        c.id, c.content, c.created_at, c.likes_count,
        u.id as user_id, u.display_name, pp.url as avatar_url,
        EXISTS(
          SELECT 1 FROM comment_likes cl
          WHERE cl.comment_id = c.id AND cl.user_id = $2
        ) as liked
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `,
      [id, req.user.userId],
    );

    const comments = result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      avatarUrl: row.avatar_url || "/assets/Frugiter-Icon-blue.jpg",
      content: row.content,
      createdAt: row.created_at,
      likesCount: row.likes_count,
      liked: row.liked,
    }));

    res.json({ comments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }

  // After inserting comment, create notification
  const postOwner = await pool.query(
    "SELECT user_id FROM posts WHERE id = $1",
    [id],
  );
  if (postOwner.rows[0]?.user_id !== req.user.userId) {
    await pool.query(
      `INSERT INTO notifications (user_id, from_user_id, type, post_id)
     VALUES ($1, $2, 'comment', $3)`,
      [postOwner.rows[0].user_id, req.user.userId, id],
    );
  }
});

// Post a comment
router.post("/:id/comments", auth, async (req: any, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Comment cannot be empty" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO comments (post_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `,
      [id, req.user.userId, content],
    );

    await pool.query(
      "UPDATE posts SET comments_count = comments_count + 1 WHERE id = $1",
      [id],
    );

    const userResult = await pool.query(
      `
      SELECT u.display_name, pp.url as avatar_url
      FROM users u
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE u.id = $1
    `,
      [req.user.userId],
    );

    const comment = result.rows[0];
    const user = userResult.rows[0];

    res.status(201).json({
      comment: {
        id: comment.id,
        userId: req.user.userId,
        displayName: user.display_name,
        avatarUrl: user.avatar_url || "/assets/Frugiter-Icon-blue.jpg",
        content: comment.content,
        createdAt: comment.created_at,
        likesCount: 0,
        liked: false,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Delete comment
router.delete(
  "/:postId/comments/:commentId",
  auth,
  async (req: any, res: Response) => {
    const { postId, commentId } = req.params;
    try {
      const comment = await pool.query(
        "SELECT user_id FROM comments WHERE id = $1",
        [commentId],
      );
      if (comment.rows.length === 0)
        return res.status(404).json({ error: "Comment not found" });
      if (comment.rows[0].user_id !== req.user.userId)
        return res.status(403).json({ error: "Not your comment" });
      await pool.query("DELETE FROM comments WHERE id = $1", [commentId]);
      await pool.query(
        "UPDATE posts SET comments_count = comments_count - 1 WHERE id = $1",
        [postId],
      );
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
);

// Like a comment
router.post(
  "/:postId/comments/:commentId/like",
  auth,
  async (req: any, res: Response) => {
    const { commentId } = req.params;
    try {
      const existing = await pool.query(
        "SELECT id FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
        [commentId, req.user.userId],
      );
      if (existing.rows.length > 0) {
        await pool.query(
          "DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2",
          [commentId, req.user.userId],
        );
        await pool.query(
          "UPDATE comments SET likes_count = likes_count - 1 WHERE id = $1",
          [commentId],
        );
        res.json({ liked: false });
      } else {
        await pool.query(
          "INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2)",
          [commentId, req.user.userId],
        );
        await pool.query(
          "UPDATE comments SET likes_count = likes_count + 1 WHERE id = $1",
          [commentId],
        );
        res.json({ liked: true });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
);

// Get replies for a comment
router.get('/:postId/comments/:commentId/replies', auth, async (req: any, res: Response) => {
  const { commentId } = req.params
  try {
    const result = await pool.query(`
      SELECT
        r.id, r.content, r.created_at, r.likes_count,
        u.id as user_id, u.display_name, u.username,
        pp.url as avatar_url,
        EXISTS(
          SELECT 1 FROM reply_likes rl
          WHERE rl.reply_id = r.id AND rl.user_id = $2
        ) as liked
      FROM comment_replies r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE r.comment_id = $1
      ORDER BY r.created_at ASC
    `, [commentId, req.user.userId])

    res.json({
      replies: result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        displayName: row.display_name,
        username: row.username,
        avatarUrl: row.avatar_url || '/assets/Frugiter-Icon-blue.jpg',
        content: row.content,
        createdAt: row.created_at,
        likesCount: row.likes_count,
        liked: row.liked
      }))
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Post a reply
router.post('/:postId/comments/:commentId/replies', auth, async (req: any, res: Response) => {
  const { commentId } = req.params
  const { content } = req.body

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Reply cannot be empty' })
  }

  try {
    const result = await pool.query(`
      INSERT INTO comment_replies (comment_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING id, content, created_at
    `, [commentId, req.user.userId, content])

    const userResult = await pool.query(`
      SELECT u.display_name, u.username, pp.url as avatar_url
      FROM users u
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE u.id = $1
    `, [req.user.userId])

    // Notify comment owner
    const commentOwner = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1', [commentId]
    )
    if (commentOwner.rows[0]?.user_id !== req.user.userId) {
      const postId = req.params.postId
      await pool.query(
        `INSERT INTO notifications (user_id, from_user_id, type, post_id)
         VALUES ($1, $2, 'reply', $3)`,
        [commentOwner.rows[0].user_id, req.user.userId, postId]
      )
    }

    const reply = result.rows[0]
    const user = userResult.rows[0]

    res.status(201).json({
      reply: {
        id: reply.id,
        userId: req.user.userId,
        displayName: user.display_name,
        username: user.username,
        avatarUrl: user.avatar_url || '/assets/Frugiter-Icon-blue.jpg',
        content: reply.content,
        createdAt: reply.created_at,
        likesCount: 0,
        liked: false
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Like a reply
router.post('/:postId/comments/:commentId/replies/:replyId/like', auth, async (req: any, res: Response) => {
  const { replyId } = req.params
  try {
    const existing = await pool.query(
      'SELECT id FROM reply_likes WHERE reply_id = $1 AND user_id = $2',
      [replyId, req.user.userId]
    )
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM reply_likes WHERE reply_id = $1 AND user_id = $2', [replyId, req.user.userId])
      await pool.query('UPDATE comment_replies SET likes_count = likes_count - 1 WHERE id = $1', [replyId])
      res.json({ liked: false })
    } else {
      await pool.query('INSERT INTO reply_likes (reply_id, user_id) VALUES ($1, $2)', [replyId, req.user.userId])
      await pool.query('UPDATE comment_replies SET likes_count = likes_count + 1 WHERE id = $1', [replyId])
      res.json({ liked: true })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Delete a reply
router.delete('/:postId/comments/:commentId/replies/:replyId', auth, async (req: any, res: Response) => {
  const { replyId } = req.params
  try {
    const reply = await pool.query('SELECT user_id FROM comment_replies WHERE id = $1', [replyId])
    if (reply.rows.length === 0) return res.status(404).json({ error: 'Reply not found' })
    if (reply.rows[0].user_id !== req.user.userId) return res.status(403).json({ error: 'Not your reply' })
    await pool.query('DELETE FROM comment_replies WHERE id = $1', [replyId])
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// Get single post
router.get('/:id', auth, async (req: any, res: Response) => {
  const { id } = req.params
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.content, p.image_url, p.likes_count, p.comments_count, p.created_at,
        u.id as user_id, u.display_name, u.username,
        pp.url as avatar_url,
        EXISTS(
          SELECT 1 FROM likes l
          WHERE l.post_id = p.id AND l.user_id = $2
        ) as liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN profile_pictures pp ON pp.user_id = u.id AND pp.is_current = true
      WHERE p.id = $1
    `, [id, req.user.userId])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' })
    }

    const row = result.rows[0]
    res.json({
      post: {
        id: row.id,
        userId: row.user_id,
        displayName: row.display_name,
        username: row.username,
        avatarUrl: row.avatar_url || '/assets/Frugiter-Icon-blue.jpg',
        content: row.content,
        imageUrl: row.image_url,
        likesCount: row.likes_count,
        commentsCount: row.comments_count,
        createdAt: row.created_at,
        liked: row.liked
      }
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router;
