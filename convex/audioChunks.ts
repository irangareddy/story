import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    bookId: v.optional(v.id("books")),
    text: v.string(),
    voiceId: v.string(),
    sampleRate: v.number(),
    durationSec: v.number(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("audioChunks", args);
  },
});

export const getUrl = query({
  args: { id: v.id("audioChunks") },
  handler: async (ctx, args) => {
    const chunk = await ctx.db.get(args.id);
    if (!chunk) return null;
    const url = await ctx.storage.getUrl(chunk.storageId);
    return { ...chunk, url };
  },
});

export const listByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("audioChunks")
      .withIndex("by_book", (q) => q.eq("bookId", args.bookId))
      .collect();
  },
});
