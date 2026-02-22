import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    filename: v.string(),
    title: v.string(),
    format: v.string(),
    pageCount: v.optional(v.number()),
    chapters: v.array(
      v.object({
        index: v.number(),
        title: v.string(),
        text: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("books", args);
  },
});

export const get = query({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const remove = mutation({
  args: { id: v.id("books") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("books").order("desc").collect();
  },
});
