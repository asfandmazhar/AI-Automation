import jwt from "jsonwebtoken";

export const formatDataToSend = (user) => {
  const access_token = jwt.sign(
    {
      id: user._id,
      role: user.role?.name || "",
      fullname: user.fullname || "",
      email: user.email || "",
      profilePicture: user.profilePicture || "",
    },
    process.env.SECRET_ACCESS_KEY,
  );
  return {
    success: true,
    access_token,
    _id: user._id,
    fullname: user.fullname,
    email: user.email,
    phone: user.phone,
    company: user.company,
    bio: user.bio,
    profilePicture: user.profilePicture,
    role: user.role,
    status: user.status,
    services: user.services,
  };
};
