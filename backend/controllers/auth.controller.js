import UserModel from "../Schema/User.js";
import RoleModel from "../Schema/Role.js";
import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import { formatDataToSend } from "../helper/auth.helper.js";
import { uploadImage } from "../helper/cloudinary.js";
import { createLog } from "../helper/log.helper.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Auth ────────────────────────────────────────────
export const Signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.send({
        success: false,
        message: "Please fill all the fields!",
      });
    }

    const user = await UserModel.findOne({ email })
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name");

    if (!user) {
      await createLog(req, { action: "Login failed", category: "auth", details: `Email: ${email} — user not found`, status: "failed" });
      return res.send({
        success: false,
        message: "Email Or Password is Incorrect!",
      });
    }

    if (user.status === "Inactive") {
      await createLog(req, { user: user._id, action: "Login failed", category: "auth", details: "Account deactivated", status: "failed" });
      return res.send({
        success: false,
        message: "Your account has been deactivated. Contact admin.",
      });
    }

    bcrypt.compare(password, user.password, async (err, result) => {
      if (err) {
        return res.send({
          success: false,
          message: "Error occurred while finding an account! Try Again",
        });
      }

      if (!result) {
        await createLog(req, { user: user._id, action: "Login failed", category: "auth", details: "Wrong password", status: "failed" });
        return res.send({
          success: false,
          message: "Email Or Password is Incorrect!",
        });
      } else {
        await createLog(req, { user: user._id, action: "Login", category: "auth", details: `${user.fullname} logged in` });
        return res.status(200).send(formatDataToSend(user));
      }
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

export const googleSignin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.send({ success: false, message: "Google credential is required!" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await UserModel.findOne({ $or: [{ googleId }, { email }] })
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name");

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.profilePicture && picture) user.profilePicture = picture;
        await user.save();
        user = await UserModel.findById(user._id)
          .populate("role", "name")
          .populate("services", "name")
          .populate("websites", "name");
      }

      if (user.status === "Inactive") {
        await createLog(req, { user: user._id, action: "Google login failed", category: "auth", details: "Account deactivated", status: "failed" });
        return res.send({ success: false, message: "Your account has been deactivated. Contact admin." });
      }

      await createLog(req, { user: user._id, action: "Google login", category: "auth", details: `${user.fullname} logged in via Google` });
      return res.status(200).send(formatDataToSend(user));
    }

    const defaultRole = await RoleModel.findOne({ name: "Viewer" });

    const newUser = new UserModel({
      fullname: name,
      email,
      googleId,
      profilePicture: picture || "",
      role: defaultRole ? defaultRole._id : null,
    });

    await newUser.save();

    const populated = await UserModel.findById(newUser._id)
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name");

    await createLog(req, { user: populated._id, action: "Google signup", category: "auth", details: `New user registered via Google: ${name} (${email})` });
    return res.status(200).send(formatDataToSend(populated));
  } catch (error) {
    await createLog(req, { action: "Google login failed", category: "auth", details: error.message, status: "failed" });
    return res.status(500).send({ success: false, message: "Google authentication failed!" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    let { page = 1, query } = req.query;
    page = parseInt(page);
    const maxLimit = 10;
    let filter = {};

    if (query && query.trim() !== "") {
      filter = {
        $or: [
          { fullname: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      };
    }

    const users = await UserModel.find(filter)
      .sort({ joinedAt: -1 })
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name")
      .select("-password")
      .skip((page - 1) * maxLimit)
      .limit(maxLimit);

    return res.status(200).json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { fullname, email, password, role, services, websites } = req.body;

    if (!fullname || !email || !password) {
      return res.send({
        success: false,
        message: "Name, email, and password are required!",
      });
    }

    const existingEmail = await UserModel.exists({ email });
    if (existingEmail) {
      return res.send({
        success: false,
        message: "Email is already registered!",
      });
    }

    const defaultRole = await RoleModel.findOne({ name: "Viewer" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      fullname,
      email,
      password: hashedPassword,
      role: role || (defaultRole ? defaultRole._id : null),
      services: services || [],
      websites: websites || [],
    });

    await user.save();

    const populated = await UserModel.findById(user._id)
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name")
      .select("-password");

    await createLog(req, { user: req.user, action: "Create user", category: "user-management", details: `Created user: ${fullname} (${email})` });
    return res.status(200).json({
      success: true,
      message: "User created successfully!",
      user: populated,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { userId, fullname, email, password, role, services, websites } = req.body;

    if (!userId) {
      return res.send({ success: false, message: "User ID is required!" });
    }

    const updateData = {};
    if (fullname !== undefined) updateData.fullname = fullname;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (services !== undefined) updateData.services = services;
    if (websites !== undefined) updateData.websites = websites;

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const user = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    })
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name")
      .select("-password");

    if (!user) {
      return res.send({ success: false, message: "User not found!" });
    }

    await createLog(req, { user: req.user, action: "Update user", category: "user-management", details: `Updated user: ${user.fullname} (${user.email})` });
    return res.status(200).json({
      success: true,
      message: "User updated successfully!",
      user,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    let { _id } = req.query;

    const user = await UserModel.findByIdAndDelete(_id);

    if (!user) {
      return res.send({ success: false, message: "User not found!" });
    }

    await createLog(req, { user: req.user, action: "Delete user", category: "user-management", details: `Deleted user: ${user.fullname} (${user.email})` });
    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

// ─── Profile ────────────────────────────────────────
export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No image uploaded!" });
    }

    const imageUrl = await uploadImage(req.file.buffer, "profile-pictures", {
      transformation: [{ width: 300, height: 300, crop: "fill" }],
    });

    const user = await UserModel.findByIdAndUpdate(
      req.user,
      { profilePicture: imageUrl },
      { new: true },
    )
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name")
      .select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    await createLog(req, { user: req.user, action: "Update profile picture", category: "profile" });
    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully!",
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user)
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name url googleSearchConsole.connected googleSearchConsole.selectedProperty googleAnalytics.connected googleAnalytics.selectedProperty")
      .select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phone, company, bio } = req.body;
    const updateData = {};

    if (fullname !== undefined) updateData.fullname = fullname;
    if (email !== undefined) {
      const existing = await UserModel.findOne({ email, _id: { $ne: req.user } });
      if (existing) {
        return res.json({ success: false, message: "Email is already in use!" });
      }
      updateData.email = email;
    }
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (bio !== undefined) updateData.bio = bio;

    const user = await UserModel.findByIdAndUpdate(req.user, updateData, { new: true })
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name")
      .select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    await createLog(req, { user: req.user, action: "Update profile", category: "profile", details: `Updated fields: ${Object.keys(updateData).join(", ")}` });
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.json({ success: false, message: "New password is required!" });
    }

    if (newPassword.length < 8) {
      return res.json({ success: false, message: "New password must be at least 8 characters!" });
    }

    const user = await UserModel.findById(req.user);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    await createLog(req, { user: req.user, action: "Change password", category: "profile" });
    return res.status(200).json({ success: true, message: "Password changed successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getTotalUsers = async (req, res) => {
  try {
    const count = await UserModel.countDocuments();
    return res.status(200).json({ success: true, count });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const impersonateUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.send({ success: false, message: "User ID is required!" });
    }

    const user = await UserModel.findById(userId)
      .populate("role", "name")
      .populate("services", "name")
      .populate("websites", "name");

    if (!user) {
      return res.send({ success: false, message: "User not found!" });
    }

    await createLog(req, { user: req.user, action: "Impersonate user", category: "auth", details: `Impersonated: ${user.fullname} (${user.email})` });
    return res.status(200).send(formatDataToSend(user));
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};

export const toggleStatus = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.send({ success: false, message: "User not found!" });
    }

    user.status = user.status === "Active" ? "Inactive" : "Active";
    await user.save();

    await createLog(req, { user: req.user, action: "Toggle user status", category: "user-management", details: `${user.fullname} → ${user.status}` });
    return res.status(200).json({
      success: true,
      message: `User ${user.status === "Active" ? "activated" : "deactivated"} successfully!`,
      status: user.status,
    });
  } catch (error) {
    return res.status(500).send({ success: false, message: error.message });
  }
};
