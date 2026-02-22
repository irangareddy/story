import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    voiceId: v.string(),
    name: v.string(),
    cloned: v.boolean(),
    tags: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("voices", args);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("voices").collect();
  },
});

export const getByVoiceId = query({
  args: { voiceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("voices")
      .withIndex("by_voiceId", (q) => q.eq("voiceId", args.voiceId))
      .first();
  },
});

export const sync = mutation({
  args: {
    voices: v.array(
      v.object({
        voiceId: v.string(),
        name: v.string(),
        cloned: v.boolean(),
        tags: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const voice of args.voices) {
      const existing = await ctx.db
        .query("voices")
        .withIndex("by_voiceId", (q) => q.eq("voiceId", voice.voiceId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: voice.name,
          cloned: voice.cloned,
          tags: voice.tags,
        });
      } else {
        await ctx.db.insert("voices", voice);
      }
    }
  },
});

export const remove = mutation({
  args: { voiceId: v.string() },
  handler: async (ctx, args) => {
    const voice = await ctx.db
      .query("voices")
      .withIndex("by_voiceId", (q) => q.eq("voiceId", args.voiceId))
      .first();
    if (voice) {
      await ctx.db.delete(voice._id);
    }
  },
});
