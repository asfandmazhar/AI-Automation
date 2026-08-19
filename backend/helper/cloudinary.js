import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import sharp from "sharp";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WEBP images are allowed!"));
    }
  },
});

export const uploadImage = async (fileBuffer, folder = "uploads", options = {}) => {
  const compressed = await sharp(fileBuffer)
    .webp({ quality: 80 })
    .toBuffer();

  return new Promise((resolve, reject) => {
    const opts = {
      folder,
      resource_type: "image",
      format: "webp",
      ...options,
    };
    const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
      if (error) return reject(error);
      resolve(result.secure_url);
    });
    stream.end(compressed);
  });
};

export default cloudinary;
