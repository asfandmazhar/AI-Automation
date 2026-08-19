import ServiceModel from "../Schema/Service.js";
import UserModel from "../Schema/User.js";
import { createLog } from "../helper/log.helper.js";

export const createService = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.send({ success: false, message: "Service name is required!" });
    }

    const existing = await ServiceModel.exists({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
    });
    if (existing) {
      return res.send({ success: false, message: "Service already exists!" });
    }

    const service = new ServiceModel({ name: name.trim() });
    await service.save();

    await createLog(req, { user: req.user, action: "Create service", category: "service", details: `Created service: ${name}` });
    return res
      .status(200)
      .json({
        success: true,
        message: "Service created successfully!",
        service,
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllServices = async (req, res) => {
  try {
    const services = await ServiceModel.find().sort({ createdAt: 1 });
    return res.status(200).json({ success: true, services });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const { _id, name } = req.body;

    if (!_id) {
      return res.send({ success: false, message: "Service ID is required!" });
    }

    if (!name || !name.trim()) {
      return res.send({ success: false, message: "Service name is required!" });
    }

    const existing = await ServiceModel.findOne({
      name: { $regex: `^${name.trim()}$`, $options: "i" },
      _id: { $ne: _id },
    });
    if (existing) {
      return res.send({
        success: false,
        message: "Service name already exists!",
      });
    }

    const service = await ServiceModel.findByIdAndUpdate(
      _id,
      { name: name.trim() },
      { new: true },
    );

    if (!service) {
      return res.send({ success: false, message: "Service not found!" });
    }

    await createLog(req, { user: req.user, action: "Update service", category: "service", details: `Updated service: ${name}` });
    return res
      .status(200)
      .json({
        success: true,
        message: "Service updated successfully!",
        service,
      });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const { _id } = req.query;

    const service = await ServiceModel.findById(_id);
    if (!service) {
      return res.send({ success: false, message: "Service not found!" });
    }

    await UserModel.updateMany({ services: _id }, { $pull: { services: _id } });

    await ServiceModel.findByIdAndDelete(_id);

    await createLog(req, { user: req.user, action: "Delete service", category: "service", details: `Deleted service: ${service.name}` });
    return res
      .status(200)
      .json({ success: true, message: "Service deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
