import mongoose from "mongoose";

const notificationPreferenceSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    email: {
      type: Boolean,
      default: true,
    },
    apiAlerts: {
      type: Boolean,
      default: true,
    },
    weeklyReport: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("notificationpreferences", notificationPreferenceSchema);
