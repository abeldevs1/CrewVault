import { NextResponse } from "next/server";
import { getDB, generateId } from "@/lib/db";
import { requireAuth, getCurrentUser } from "@/lib/auth";
import { getR2Bucket, buildR2OriginalKey } from "@/lib/storage";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const db = await getDB();

    const { results: posts } = await db
      .prepare(
        `SELECT p.id, p.author_id, p.title, p.content, p.tags, p.status, p.visibility, p.anonymous_uploader, 
                p.views_count, p.likes_count, p.created_at, 
                u.full_name as author_name, u.role as author_role
         FROM posts p
         JOIN users u ON p.author_id = u.id
         WHERE p.status = 'published'
         ORDER BY p.created_at DESC
         LIMIT 50`
      )
      .all<any>();

    const { results: attachments } = await db
      .prepare(`SELECT * FROM post_attachments`)
      .all<any>();

    const formatted = posts.map((post) => {
      const isAnon = Boolean(post.anonymous_uploader);
      const isAdmin = user?.role === "ADMIN";
      const isAuthor = user?.id === post.author_id;

      return {
        ...post,
        author_name: isAnon && !isAdmin && !isAuthor ? "Anonymous Crew Member" : post.author_name,
        author_role: isAnon && !isAdmin && !isAuthor ? "MEMBER" : post.author_role,
        tags: post.tags ? JSON.parse(post.tags) : [],
        attachments: attachments.filter((att) => att.post_id === post.id),
      };
    });

    return NextResponse.json({ success: true, posts: formatted });
  } catch (err: any) {
    console.error("GET Posts Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    let title = "";
    let content = "";
    let tagsStr = "";
    let visibility = "public";
    let is_anonymous = false;
    let file: File | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      title = (formData.get("title") as string) || "";
      content = (formData.get("content") as string) || "";
      tagsStr = (formData.get("tags") as string) || "";
      visibility = (formData.get("visibility") as string) || "public";
      is_anonymous = formData.get("is_anonymous") === "true";
      file = formData.get("file") as File | null;
    } else {
      const body = await request.json();
      title = body.title || "";
      content = body.content || "";
      tagsStr = Array.isArray(body.tags) ? body.tags.join(",") : body.tags || "";
      visibility = body.visibility || "public";
      is_anonymous = Boolean(body.is_anonymous);
    }

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const db = await getDB();
    const postId = generateId("post");
    const tagsArray = tagsStr
      ? tagsStr.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
      : ["study-tip"];

    await db
      .prepare(
        `INSERT INTO posts (id, author_id, title, content, tags, status, visibility, anonymous_uploader)
         VALUES (?, ?, ?, ?, ?, 'published', ?, ?)`
      )
      .bind(postId, user.id, title, content, JSON.stringify(tagsArray), visibility, is_anonymous ? 1 : 0)
      .run();

    // Process optional attached file/image
    if (file && file.size > 0) {
      const attId = generateId("att");
      const r2Key = buildR2OriginalKey(postId, attId, file.name);

      try {
        const fileBuffer = await file.arrayBuffer();
        const bucket = await getR2Bucket();
        await bucket.put(r2Key, fileBuffer, {
          httpMetadata: { contentType: file.type || "application/octet-stream" },
        });
      } catch (e) {
        console.warn("Post attachment R2 upload warning:", e);
      }

      await db
        .prepare(
          `INSERT INTO post_attachments (id, post_id, file_r2_key, file_name, file_mime_type)
           VALUES (?, ?, ?, ?, ?)`
        )
        .bind(attId, postId, r2Key, file.name, file.type || "application/octet-stream")
        .run();
    }

    return NextResponse.json({
      success: true,
      post_id: postId,
      message: "Post published successfully with attachments",
    });
  } catch (err: any) {
    console.error("POST Post Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create post" }, { status: 500 });
  }
}
