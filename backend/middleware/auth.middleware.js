import JWT from "jsonwebtoken";
import UserModel from "../Schema/User.js";

export const verifyJWT = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "No Access Token!" });
    }

    JWT.verify(token, process.env.SECRET_ACCESS_KEY, (error, decode) => {
      if (error) {
        return res.status(401).json({ success: false, message: "Access Token is Invalid!" });
      }

      req.user = decode.id;
      next();
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user).populate("role", "name");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found!" });
    }
    if (user.role?.name?.toLowerCase() !== "admin") {
      return res.status(403).json({ success: false, message: "Admin access required!" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
