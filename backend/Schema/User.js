import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    fullname: {
      type: String,
      lowercase: true,
      required: true,
      minlength: [3, "fullname must be 3 letters long"],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: "",
    },
    phone: {
      type: String,
      default: "",
    },
    company: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    profilePicture: {
      type: String,
      default: "",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "roles",
      default: null,
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "services",
      },
    ],
    websites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "websites",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: {
      createdAt: "joinedAt",
    },
  },
);

export default mongoose.model("users", userSchema);
