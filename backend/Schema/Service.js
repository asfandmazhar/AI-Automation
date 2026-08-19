import mongoose from "mongoose";

const serviceSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("services", serviceSchema);
