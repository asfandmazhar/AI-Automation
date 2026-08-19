import mongoose from "mongoose";

const websiteSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    customFields: [
      {
        label: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending"],
      default: "Active",
    },
    googleSearchConsole: {
      connected: { type: Boolean, default: false },
      googleEmail: { type: String, default: "" },
      accessToken: { type: String, default: "" },
      refreshToken: { type: String, default: "" },
      expiryDate: { type: Date, default: null },
      scopes: { type: [String], default: [] },
      selectedProperty: { type: String, default: "" },
    },
    googleAnalytics: {
      connected: { type: Boolean, default: false },
      googleEmail: { type: String, default: "" },
      accessToken: { type: String, default: "" },
      refreshToken: { type: String, default: "" },
      expiryDate: { type: Date, default: null },
      scopes: { type: [String], default: [] },
      selectedProperty: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("websites", websiteSchema);
