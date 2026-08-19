import mongoose from "mongoose";

const apiKeySchema = mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["openai", "dataforseo"],
      required: true,
      unique: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("apikeys", apiKeySchema);
