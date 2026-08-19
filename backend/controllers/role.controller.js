import RoleModel from "../Schema/Role.js";
import UserModel from "../Schema/User.js";
import { createLog } from "../helper/log.helper.js";

export const createRole = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.send({ success: false, message: "Role name is required!" });
    }

    const existing = await RoleModel.exists({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return res.send({ success: false, message: "Role already exists!" });
    }

    const role = new RoleModel({ name: name.trim() });
    await role.save();

    await createLog(req, { user: req.user, action: "Create role", category: "role", details: `Created role: ${name}` });
    return res
      .status(200)
      .json({ success: true, message: "Role created successfully!", role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRoles = async (req, res) => {
  try {
    const roles = await RoleModel.find().sort({ createdAt: 1 });
    return res.status(200).json({ success: true, roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { _id, name } = req.body;

    if (!_id) {
      return res.send({ success: false, message: "Role ID is required!" });
    }

    if (!name || !name.trim()) {
      return res.send({ success: false, message: "Role name is required!" });
    }

    const existing = await RoleModel.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      _id: { $ne: _id },
    });
    if (existing) {
      return res.send({ success: false, message: "Role name already exists!" });
    }

    const role = await RoleModel.findByIdAndUpdate(
      _id,
      { name: name.trim() },
      { new: true },
    );

    if (!role) {
      return res.send({ success: false, message: "Role not found!" });
    }

    await createLog(req, { user: req.user, action: "Update role", category: "role", details: `Updated role: ${name}` });
    return res
      .status(200)
      .json({ success: true, message: "Role updated successfully!", role });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { _id } = req.query;

    const role = await RoleModel.findById(_id);
    if (!role) {
      return res.send({ success: false, message: "Role not found!" });
    }

    const fallback = await RoleModel.findOne({ name: "Viewer" });
    const fallbackId =
      fallback && fallback._id.toString() !== _id ? fallback._id : null;

    await UserModel.updateMany({ role: _id }, { role: fallbackId });

    await RoleModel.findByIdAndDelete(_id);

    await createLog(req, { user: req.user, action: "Delete role", category: "role", details: `Deleted role: ${role.name}` });
    return res
      .status(200)
      .json({ success: true, message: "Role deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
