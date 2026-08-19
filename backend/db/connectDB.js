import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(
      `Database Connected Successfully On Host ${conn.connection.host}`
    );
  } catch (error) {
    console.log(`DB Connection Error ${error}`);
  }
};

export default connectDB;
