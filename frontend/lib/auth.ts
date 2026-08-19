import Cookies from "js-cookie";

interface TokenUser {
  id: string;
  role: string;
  fullname: string;
  email: string;
  profilePicture: string;
}

export function getTokenUser(): TokenUser {
  const token = Cookies.get("access_token");
  if (!token) return { id: "", role: "", fullname: "", email: "", profilePicture: "" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id || "",
      role: payload.role || "",
      fullname: payload.fullname || "",
      email: payload.email || "",
      profilePicture: payload.profilePicture || "",
    };
  } catch {
    return { id: "", role: "", fullname: "", email: "", profilePicture: "" };
  }
}

export function clearAuth() {
  Cookies.remove("access_token");
  window.location.href = "/auth";
}
