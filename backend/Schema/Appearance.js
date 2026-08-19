import mongoose from "mongoose";

const appearanceSchema = mongoose.Schema(
  {
    primary: { type: String, default: "" },
    secondary: { type: String, default: "" },
    success: { type: String, default: "" },
    error: { type: String, default: "" },
    warning: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("appearance", appearanceSchema);
