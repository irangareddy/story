import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    audioChunkId: v.optional(v.id("audioChunks")),
    text: v.string(),
    audioLength: v.number(),
    language: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcriptions", args);
  },
});

export const get = query({
  args: { id: v.id("transcriptions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const listByAudioChunk = query({
  args: { audioChunkId: v.id("audioChunks") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcriptions")
      .filter((q) => q.eq(q.field("audioChunkId"), args.audioChunkId))
      .collect();
  },
});
