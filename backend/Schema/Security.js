import mongoose from "mongoose";

const securitySchema = mongoose.Schema(
  {
    loginAlerts: {
      type: Boolean,
      default: true,
    },
    sessionTimeout: {
      type: Number,
      default: 30,
    },
    forceLogoutAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("security", securitySchema);
