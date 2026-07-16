const mongoose = require("mongoose");

const greetingSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [200, "Message cannot exceed 200 characters"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Greeting", greetingSchema);
