import mongoose from "mongoose";

const contentCreationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    website: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "websites",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    mode: {
      type: String,
      enum: ["standard", "advanced"],
      default: "standard",
    },
    input: {
      topic: { type: String, default: "" },
      keywords: [{ type: String }],
      tone: {
        type: String,
        enum: [
          "Professional",
          "Casual",
          "Friendly",
          "Authoritative",
          "Conversational",
        ],
        default: "Professional",
      },
      length: {
        type: String,
        enum: [
          "Short (300-500)",
          "Medium (800-1200)",
          "Long (1500-2500)",
          "In-depth (3000+)",
          "Custom",
        ],
        default: "Medium (800-1200)",
      },
      customLength: { type: Number, default: null },
      url: { type: String, default: "" },
      pastedContent: { type: String, default: "" },
    },
    content: {
      markdown: { type: String, default: "" },
      checklist: [
        {
          label: { type: String },
          done: { type: Boolean, default: false },
        },
      ],
    },
    humanize: {
      isHumanized: { type: Boolean, default: false },
      humanizedContent: { type: String, default: "" },
      analysis: {
        humanScore: { type: Number, default: 0 },
        aiScore: { type: Number, default: 0 },
        sentenceStructure: { type: Number, default: 0 },
        readability: { type: Number, default: 0 },
        humanWritten: { type: Number, default: 0 },
        mixed: { type: Number, default: 0 },
        aiGenerated: { type: Number, default: 0 },
      },
    },
    meta: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      slug: { type: String, default: "" },
      canonical: { type: String, default: "" },
      ogTitle: { type: String, default: "" },
      ogDescription: { type: String, default: "" },
      twitterTitle: { type: String, default: "" },
      twitterDescription: { type: String, default: "" },
      schema: { type: String, default: "" },
    },
    refinements: [
      {
        prompt: { type: String },
        markdown: { type: String },
        at: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "generating", "completed", "failed"],
      default: "draft",
    },
  },
  {
    timestamps: true,
  },
);

contentCreationSchema.index({ user: 1, website: 1, createdAt: -1 });

export default mongoose.model("content_creations", contentCreationSchema);
