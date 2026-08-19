import mongoose from "mongoose";

const logSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null,
  },
  action: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: [
      "auth",
      "user-management",
      "profile",
      "role",
      "service",
      "website",
      "api-key",
      "appearance",
      "notification",
      "security",
    ],
    required: true,
  },
  details: {
    type: String,
    default: "",
  },
  ip: {
    type: String,
    default: "",
  },
  userAgent: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success",
  },
}, {
  timestamps: true,
});

export default mongoose.model("logs", logSchema);
