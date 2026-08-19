import mongoose from "mongoose";

const aiUsageSchema = mongoose.Schema(
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
    action: {
      type: String,
      enum: ["generate", "refine", "analyze", "humanize", "meta", "keyword-analysis", "competitor-analysis", "backlink-analysis"],
      required: true,
    },
    model: {
      type: String,
      default: "gpt-4o-mini",
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

aiUsageSchema.index({ user: 1, createdAt: -1 });
aiUsageSchema.index({ website: 1, createdAt: -1 });
aiUsageSchema.index({ createdAt: -1 });

export default mongoose.model("ai_usages", aiUsageSchema);
