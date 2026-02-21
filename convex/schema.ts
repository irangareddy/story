import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  books: defineTable({
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
  }),

  audioChunks: defineTable({
    bookId: v.optional(v.id("books")),
    text: v.string(),
    voiceId: v.string(),
    sampleRate: v.number(),
    durationSec: v.number(),
    storageId: v.id("_storage"),
  }).index("by_book", ["bookId"]),

  voices: defineTable({
    voiceId: v.string(),
    name: v.string(),
    cloned: v.boolean(),
    tags: v.optional(v.any()),
  }).index("by_voiceId", ["voiceId"]),

  transcriptions: defineTable({
    audioChunkId: v.optional(v.id("audioChunks")),
    text: v.string(),
    audioLength: v.number(),
    language: v.string(),
  }),
});
