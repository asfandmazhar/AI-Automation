"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  ExternalLink,
  Eye,
  EyeOff,
  Shield,
  Layers,
  Phone,
  Building2,
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import axios from "axios";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import { getTokenUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface UserItem {
  _id: string;
  fullname: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
  services: string[];
  websites: string[];
  profilePicture: string;
  phone: string;
  company: string;
  bio: string;
}

const PER_PAGE = 6;

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } };
}

export default function ManageUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<{ _id: string; name: string }[]>([]);
  const [allWebsites, setAllWebsites] = useState<{ _id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState("Viewer");
  const [formServices, setFormServices] = useState<string[]>([]);
  const [formWebsites, setFormWebsites] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [rolesLoading, setRolesLoading] = useState(true);
  const [addingRole, setAddingRole] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [addingService, setAddingService] = useState(false);
  const [updatingService, setUpdatingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(
    null,
  );
  const [savingUser, setSavingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    loading: boolean;
  }>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
    loading: false,
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [servicesOpen, setServicesOpen] = useState(false);
  const [websitesOpen, setWebsitesOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"All" | "Active" | "Inactive">("All");
  const [filterRole, setFilterRole] = useState("All");
  const [page, setPage] = useState(1);
  const servicesRef = useRef<HTMLDivElement>(null);
  const websitesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/get-all-users`,
          authHeaders(),
        );
        if (res.data.success) {
          const mapped: UserItem[] = res.data.users.map((u: any) => ({
            _id: u._id,
            fullname: u.fullname,
            email: u.email,
            role: u.role?.name || "Viewer",
            status: u.status,
            services: u.services?.map((s: any) => s.name) || [],
            websites: u.websites?.map((w: any) => w.name) || [],
            profilePicture: u.profilePicture || "",
            phone: u.phone || "",
            company: u.company || "",
            bio: u.bio || "",
          }));
          setUsers(mapped);
        } else {
          toast.error(res.data.message || "Failed to fetch users");
        }
      } catch {
        toast.error("Failed to connect to server");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/roles/get-all`,
          authHeaders(),
        );
        if (res.data.success) {
          setRoles(
            res.data.roles.map((r: any) => ({ _id: r._id, name: r.name })),
          );
        }
      } catch {
        toast.error("Failed to fetch roles");
      } finally {
        setRolesLoading(false);
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/services/get-all`,
          authHeaders(),
        );
        if (res.data.success) {
          setServices(
            res.data.services.map((s: any) => ({ _id: s._id, name: s.name })),
          );
        }
      } catch {
        toast.error("Failed to fetch services");
      } finally {
        setServicesLoading(false);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/websites/get-all`,
          authHeaders(),
        );
        if (res.data.success) {
          setAllWebsites(
            res.data.websites.map((w: any) => ({ _id: w._id, name: w.name })),
          );
        }
      } catch {}
    };
    fetchWebsites();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        servicesRef.current &&
        !servicesRef.current.contains(e.target as Node)
      ) {
        setServicesOpen(false);
      }
      if (
        websitesRef.current &&
        !websitesRef.current.contains(e.target as Node)
      ) {
        setWebsitesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loggedInUserId = getTokenUser().id;

  const filtered = users
    .filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch =
        u.fullname.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.services.some((s) => s.toLowerCase().includes(q)) ||
        u.websites.some((w) => w.toLowerCase().includes(q));
      const matchesStatus =
        filterStatus === "All" || u.status === filterStatus;
      const matchesRole =
        filterRole === "All" || u.role === filterRole;
      return matchesSearch && matchesStatus && matchesRole;
    })
    .sort((a, b) => {
      if (a._id === loggedInUserId) return -1;
      if (b._id === loggedInUserId) return 1;
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );
  const startIdx = (safePage - 1) * PER_PAGE + 1;
  const endIdx = Math.min(safePage * PER_PAGE, filtered.length);

  function openAdd() {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setShowPassword(false);
    setFormRole(roles[0]?.name || "");
    setFormServices([]);
    setFormWebsites([]);
    setFormErrors({});
    setShowModal(true);
  }

  function openEdit(user: UserItem) {
    setEditingUser(user);
    setFormName(user.fullname);
    setFormEmail(user.email);
    setFormPassword("");
    setShowPassword(false);
    setFormRole(user.role);
    setFormServices([...user.services]);
    setFormWebsites([...user.websites]);
    setFormErrors({});
    setShowModal(true);
  }

  function validateName(value: string): string | undefined {
    if (!value.trim()) return "Full name is required";
    if (value.trim().length < 3) return "Name must be at least 3 characters";
    if (!/^[a-zA-Z\s]+$/.test(value.trim()))
      return "Please enter a valid name using letters only";
    return undefined;
  }

  function validateEmail(value: string): string | undefined {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
      return "Please enter a valid email address";
    return undefined;
  }

  function validatePassword(value: string): string | undefined {
    if (!editingUser && !value) return "Password is required";
    if (!value && editingUser) return undefined;
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Must include an uppercase letter";
    if (!/[a-z]/.test(value)) return "Must include a lowercase letter";
    if (!/[0-9]/.test(value)) return "Must include a number";
    if (!/[^a-zA-Z0-9]/.test(value)) return "Must include a special character";
    return undefined;
  }

  function validateForm(): boolean {
    const errors: typeof formErrors = {};
    errors.name = validateName(formName);
    errors.email = validateEmail(formEmail);
    errors.password = validatePassword(formPassword);
    setFormErrors(errors);
    return !errors.name && !errors.email && !errors.password;
  }

  function toggleService(service: string) {
    setFormServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service],
    );
  }

  function toggleWebsite(website: string) {
    setFormWebsites((prev) =>
      prev.includes(website)
        ? prev.filter((w) => w !== website)
        : [...prev, website],
    );
  }

  async function handleSave() {
    if (!validateForm()) return;

    if (editingUser) {
      const roleObj = roles.find((r) => r.name === formRole);
      const serviceIds = services
        .filter((s) => formServices.includes(s.name))
        .map((s) => s._id);
      const websiteIds = allWebsites
        .filter((w) => formWebsites.includes(w.name))
        .map((w) => w._id);

      setSavingUser(true);
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/update-user`,
          {
            userId: editingUser._id,
            fullname: formName.trim(),
            email: formEmail.trim(),
            password: formPassword || undefined,
            role: roleObj?._id || null,
            services: serviceIds,
            websites: websiteIds,
          },
          authHeaders(),
        );
        if (res.data.success) {
          const u = res.data.user;
          setUsers((prev) =>
            prev.map((existing) =>
              existing._id === editingUser._id
                ? {
                    _id: u._id,
                    fullname: u.fullname,
                    email: u.email,
                    role: u.role?.name || "Viewer",
                    status: u.status || "Active",
                    services: u.services?.map((s: any) => s.name) || [],
                    websites: u.websites?.map((w: any) => w.name) || [],
                    profilePicture: u.profilePicture || "",
                    phone: u.phone || "",
                    company: u.company || "",
                    bio: u.bio || "",
                  }
                : existing,
            ),
          );
          setShowModal(false);
          toast.success(res.data.message || "User updated successfully!");
        } else {
          toast.error(res.data.message || "Failed to update user");
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Failed to connect to server",
        );
      } finally {
        setSavingUser(false);
      }
    } else {
      const roleObj = roles.find((r) => r.name === formRole);
      const serviceIds = services
        .filter((s) => formServices.includes(s.name))
        .map((s) => s._id);
      const websiteIds = allWebsites
        .filter((w) => formWebsites.includes(w.name))
        .map((w) => w._id);

      setSavingUser(true);
      try {
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/create-user`,
          {
            fullname: formName.trim(),
            email: formEmail.trim(),
            password: formPassword,
            role: roleObj?._id || null,
            services: serviceIds,
            websites: websiteIds,
          },
          authHeaders(),
        );
        if (res.data.success) {
          const u = res.data.user;
          setUsers((prev) => [
            ...prev,
            {
              _id: u._id,
              fullname: u.fullname,
              email: u.email,
              role: u.role?.name || "Viewer",
              status: u.status || "Active",
              services: u.services?.map((s: any) => s.name) || [],
              websites: u.websites?.map((w: any) => w.name) || [],
              profilePicture: u.profilePicture || "",
              phone: u.phone || "",
              company: u.company || "",
              bio: u.bio || "",
            },
          ]);
          setShowModal(false);
          toast.success(res.data.message || "User created successfully!");
        } else {
          toast.error(res.data.message || "Failed to create user");
        }
      } catch (err: any) {
        toast.error(
          err?.response?.data?.message || "Failed to connect to server",
        );
      } finally {
        setSavingUser(false);
      }
    }
  }

  function handleDelete(id: string) {
    if (getTokenUser().id === id) {
      toast.error("You cannot delete your own account");
      return;
    }
    const user = users.find((u) => u._id === id);
    setConfirmDialog({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${user?.fullname}"? This action cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, loading: true }));
        try {
          const res = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/delete-user`,
            { params: { _id: id }, ...authHeaders() },
          );
          if (res.data.success) {
            setUsers((prev) => prev.filter((u) => u._id !== id));
            toast.success(res.data.message || "User deleted successfully!");
          } else {
            toast.error(res.data.message || "Failed to delete user");
          }
        } catch (err: any) {
          toast.error(
            err?.response?.data?.message || "Failed to connect to server",
          );
        } finally {
          setConfirmDialog((p) => ({ ...p, open: false, loading: false }));
        }
      },
    });
  }

  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  async function toggleStatus(id: string) {
    setTogglingStatusId(id);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/toggle-status`,
        { userId: id },
        authHeaders(),
      );
      if (res.data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u._id === id ? { ...u, status: res.data.status } : u,
          ),
        );
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || "Failed to update status");
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to connect to server",
      );
    } finally {
      setTogglingStatusId(null);
    }
  }

  async function handleAddRole() {
    if (!newRoleName.trim()) return;
    if (roles.some((r) => r.name === newRoleName.trim())) return;
    setAddingRole(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/roles/create`,
        { name: newRoleName.trim() },
        authHeaders(),
      );
      if (res.data.success) {
        setRoles((prev) => [
          ...prev,
          { _id: res.data.role._id, name: res.data.role.name },
        ]);
        setNewRoleName("");
        toast.success(res.data.message || "Role created successfully!");
      } else {
        toast.error(res.data.message || "Failed to create role");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setAddingRole(false);
    }
  }

  async function handleUpdateRole() {
    if (!editingRoleId || !editRoleName.trim()) return;
    setUpdatingRole(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/roles/update`,
        { _id: editingRoleId, name: editRoleName.trim() },
        authHeaders(),
      );
      if (res.data.success) {
        const oldRole = roles.find((r) => r._id === editingRoleId);
        setRoles((prev) =>
          prev.map((r) =>
            r._id === editingRoleId ? { ...r, name: res.data.role.name } : r,
          ),
        );
        if (oldRole) {
          setUsers((prev) =>
            prev.map((u) =>
              u.role === oldRole.name ? { ...u, role: res.data.role.name } : u,
            ),
          );
        }
        setEditingRoleId(null);
        setEditRoleName("");
        toast.success(res.data.message || "Role updated successfully!");
      } else {
        toast.error(res.data.message || "Failed to update role");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setUpdatingRole(false);
    }
  }

  function handleDeleteRole(roleId: string) {
    const role = roles.find((r) => r._id === roleId);
    setConfirmDialog({
      open: true,
      title: "Delete Role",
      message: `Are you sure you want to delete the "${role?.name}" role? Users with this role will be reassigned to "Viewer".`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, loading: true }));
        setDeletingRoleId(roleId);
        try {
          const res = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/roles/delete`,
            { params: { _id: roleId }, ...authHeaders() },
          );
          if (res.data.success) {
            setRoles((prev) => prev.filter((r) => r._id !== roleId));
            if (role) {
              setUsers((prev) =>
                prev.map((u) =>
                  u.role === role.name ? { ...u, role: "Viewer" } : u,
                ),
              );
            }
            toast.success(res.data.message || "Role deleted successfully!");
          } else {
            toast.error(res.data.message || "Failed to delete role");
          }
        } catch {
          toast.error("Failed to connect to server");
        } finally {
          setDeletingRoleId(null);
          setConfirmDialog((p) => ({ ...p, open: false, loading: false }));
        }
      },
    });
  }

  async function handleAddService() {
    if (!newServiceName.trim()) return;
    if (services.some((s) => s.name === newServiceName.trim())) return;
    setAddingService(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/services/create`,
        { name: newServiceName.trim() },
        authHeaders(),
      );
      if (res.data.success) {
        setServices((prev) => [
          ...prev,
          { _id: res.data.service._id, name: res.data.service.name },
        ]);
        setNewServiceName("");
        toast.success(res.data.message || "Service created successfully!");
      } else {
        toast.error(res.data.message || "Failed to create service");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setAddingService(false);
    }
  }

  async function handleUpdateService() {
    if (!editingServiceId || !editServiceName.trim()) return;
    setUpdatingService(true);
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/services/update`,
        { _id: editingServiceId, name: editServiceName.trim() },
        authHeaders(),
      );
      if (res.data.success) {
        const oldService = services.find((s) => s._id === editingServiceId);
        setServices((prev) =>
          prev.map((s) =>
            s._id === editingServiceId
              ? { ...s, name: res.data.service.name }
              : s,
          ),
        );
        if (oldService) {
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              services: u.services.map((svc) =>
                svc === oldService.name ? res.data.service.name : svc,
              ),
            })),
          );
        }
        setEditingServiceId(null);
        setEditServiceName("");
        toast.success(res.data.message || "Service updated successfully!");
      } else {
        toast.error(res.data.message || "Failed to update service");
      }
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setUpdatingService(false);
    }
  }

  function handleDeleteService(serviceId: string) {
    const service = services.find((s) => s._id === serviceId);
    setConfirmDialog({
      open: true,
      title: "Delete Service",
      message: `Are you sure you want to delete the "${service?.name}" service? It will be removed from all users.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, loading: true }));
        setDeletingServiceId(serviceId);
        try {
          const res = await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/services/delete`,
            { params: { _id: serviceId }, ...authHeaders() },
          );
          if (res.data.success) {
            setServices((prev) => prev.filter((s) => s._id !== serviceId));
            if (service) {
              setUsers((prev) =>
                prev.map((u) => ({
                  ...u,
                  services: u.services.filter((svc) => svc !== service.name),
                })),
              );
            }
            toast.success(res.data.message || "Service deleted successfully!");
          } else {
            toast.error(res.data.message || "Failed to delete service");
          }
        } catch {
          toast.error("Failed to connect to server");
        } finally {
          setDeletingServiceId(null);
          setConfirmDialog((p) => ({ ...p, open: false, loading: false }));
        }
      },
    });
  }

  async function handleImpersonate(userId: string) {
    try {
      const adminToken = Cookies.get("access_token");
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/impersonate`,
        { userId },
        authHeaders(),
      );
      if (res.data.success) {
        Cookies.set("admin_token", adminToken || "", { expires: 1 });
        Cookies.set("access_token", res.data.access_token, { expires: 1 });
        toast.success(`Logged in as ${res.data.fullname}`);
        router.push("/dashboard");
      } else {
        toast.error(res.data.message || "Failed to impersonate user");
      }
    } catch {
      toast.error("Failed to connect to server");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
            Manage Users
          </h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
            Add, edit, or remove platform users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowServiceModal(true)}
            className="shrink-0 cursor-pointer"
          >
            <Layers className="h-4 w-4" />
            Add Service
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowRoleModal(true)}
            className="shrink-0 cursor-pointer"
          >
            <Shield className="h-4 w-4" />
            Add Role
          </Button>
          <Button onClick={openAdd} className="shrink-0 cursor-pointer">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <Card className="p-0">
        <div className="border-b border-[color:var(--border)] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search by name, email, service, or website..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] pl-10 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as "All" | "Active" | "Inactive");
                  setPage(1);
                }}
                className="h-10 cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setPage(1);
                }}
                className="h-10 cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
              >
                <option value="All">All Roles</option>
                {roles.map((role) => (
                  <option key={role._id} value={role.name}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  Email
                </th>
                <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] sm:table-cell">
                  Role
                </th>
                <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] lg:table-cell">
                  Services
                </th>
                <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] lg:table-cell">
                  Websites
                </th>
                <th className="hidden px-6 py-3 text-xs font-semibold uppercase tracking-wider md:table-cell">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--border)]">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="h-4 w-28 rounded bg-[color:var(--muted)]" />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="h-4 w-40 rounded bg-[color:var(--muted)]" />
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 sm:table-cell">
                      <div className="h-4 w-16 rounded bg-[color:var(--muted)]" />
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="flex gap-1">
                        <div className="h-5 w-20 rounded bg-[color:var(--muted)]" />
                        <div className="h-5 w-20 rounded bg-[color:var(--muted)]" />
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="flex gap-1">
                        <div className="h-5 w-20 rounded bg-[color:var(--muted)]" />
                        <div className="h-5 w-20 rounded bg-[color:var(--muted)]" />
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                      <div className="h-5 w-16 rounded-full bg-[color:var(--muted)]" />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="h-7 w-7 rounded-lg bg-[color:var(--muted)]" />
                        <div className="h-7 w-7 rounded-lg bg-[color:var(--muted)]" />
                        <div className="h-6 w-11 rounded-full bg-[color:var(--muted)]" />
                        <div className="h-7 w-20 rounded-lg bg-[color:var(--muted)]" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginated.length > 0 ? (
                paginated.map((user) => (
                  <tr
                    key={user._id}
                    className="transition-colors duration-200 hover:bg-[color:var(--muted)]"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="group relative flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.fullname}
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-xs font-semibold text-[color:var(--primary-foreground)]">
                            {user.fullname
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        )}
                        <span className="capitalize font-medium text-[color:var(--foreground)]">
                          {user.fullname}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-[color:var(--muted-foreground)]">
                      {user.email}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-[color:var(--muted-foreground)] sm:table-cell">
                      {user.role}
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.services.length > 0 ? (
                          user.services.slice(0, 2).map((s) => (
                            <span
                              key={s}
                              className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[color:var(--muted-foreground)]">
                            None
                          </span>
                        )}
                        {user.services.length > 2 && (
                          <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
                            +{user.services.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {user.websites.length > 0 ? (
                          user.websites.slice(0, 2).map((w) => (
                            <span
                              key={w}
                              className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-[color:var(--success)]/10 text-[color:var(--success)]"
                            >
                              {w}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[color:var(--muted-foreground)]">
                            None
                          </span>
                        )}
                        {user.websites.length > 2 && (
                          <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium bg-[color:var(--muted)] text-[color:var(--muted-foreground)]">
                            +{user.websites.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 md:table-cell">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          user.status === "Active"
                            ? "bg-[color:var(--success)] text-[color:var(--success-foreground)]"
                            : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]",
                        )}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(user)}
                          className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                          aria-label={`Edit ${user.fullname}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4 cursor-pointer" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user._id)}
                          className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--error)]"
                          aria-label={`Delete ${user.fullname}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-[color:var(--error)] cursor-pointer" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(user._id)}
                          disabled={togglingStatusId === user._id}
                          className={cn(
                            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                            user.status === "Active"
                              ? "bg-[color:var(--primary)]"
                              : "bg-[color:var(--muted-foreground)]/30",
                          )}
                          role="switch"
                          aria-checked={user.status === "Active"}
                          aria-label={`${user.status === "Active" ? "Disable" : "Enable"} ${user.fullname}`}
                          title={
                            user.status === "Active" ? "Disable" : "Enable"
                          }
                        >
                          <span
                            className={cn(
                              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
                              user.status === "Active"
                                ? "translate-x-5"
                                : "translate-x-0",
                            )}
                          />
                        </button>
                        {user.role.toLowerCase() !== "admin" && (
                          <button
                            type="button"
                            onClick={() => handleImpersonate(user._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[color:var(--primary)] transition-colors duration-200 hover:bg-[color:var(--primary)]/10 cursor-pointer"
                            title="Login as this user"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Dashboard
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-[color:var(--muted-foreground)]"
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > PER_PAGE && (
          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-4 py-3">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Showing {startIdx}–{endIdx} of {filtered.length} users
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer",
                    safePage === p
                      ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                      : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
          />
          <Card className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                aria-label="Close"
              >
                <X className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4 pt-4">
              <Input
                id="user-name"
                label="Name"
                placeholder="Full name"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (formErrors.name)
                    setFormErrors((p) => ({
                      ...p,
                      name: validateName(e.target.value),
                    }));
                }}
                onBlur={() =>
                  setFormErrors((p) => ({ ...p, name: validateName(formName) }))
                }
                error={formErrors.name}
              />
              <Input
                id="user-email"
                type="email"
                label="Email"
                placeholder="user@example.com"
                value={formEmail}
                onChange={(e) => {
                  setFormEmail(e.target.value);
                  if (formErrors.email)
                    setFormErrors((p) => ({
                      ...p,
                      email: validateEmail(e.target.value),
                    }));
                }}
                onBlur={() =>
                  setFormErrors((p) => ({
                    ...p,
                    email: validateEmail(formEmail),
                  }))
                }
                error={formErrors.email}
              />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="user-password"
                  className="text-sm font-medium text-[color:var(--foreground)]"
                >
                  Password{" "}
                  {editingUser && (
                    <span className="text-xs text-[color:var(--muted-foreground)]">
                      (leave empty to keep current)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      editingUser ? "Enter new password" : "Create password"
                    }
                    value={formPassword}
                    onChange={(e) => {
                      setFormPassword(e.target.value);
                      if (formErrors.password)
                        setFormErrors((p) => ({
                          ...p,
                          password: validatePassword(e.target.value),
                        }));
                    }}
                    onBlur={() =>
                      setFormErrors((p) => ({
                        ...p,
                        password: validatePassword(formPassword),
                      }))
                    }
                    className={cn(
                      "flex h-10 w-full rounded-xl border bg-[color:var(--card)] px-3 pr-10 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] transition-colors duration-200 focus:outline-none focus:ring-2",
                      formErrors.password
                        ? "border-[color:var(--error)] focus:ring-[color:var(--error)] focus:border-[color:var(--error)]"
                        : "border-[color:var(--border)] focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)]",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-[color:var(--error)]" role="alert">
                    {formErrors.password}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="user-role"
                  className="text-sm font-medium text-[color:var(--foreground)]"
                >
                  Role
                </label>
                <select
                  id="user-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
                >
                  {roles.map((role) => (
                    <option key={role._id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              {formRole.toLowerCase() !== "admin" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Services Access
                  </label>
                  <div className="relative" ref={servicesRef}>
                    <button
                      type="button"
                      onClick={() => setServicesOpen(!servicesOpen)}
                      className="flex cursor-pointer h-10 w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
                    >
                      <span
                        className={cn(
                          formServices.length === 0 &&
                            "text-[color:var(--muted-foreground)]",
                        )}
                      >
                        {formServices.length === 0
                          ? "Select services"
                          : `${formServices.length} service${formServices.length > 1 ? "s" : ""} selected`}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[color:var(--muted-foreground)] transition-transform duration-200",
                          servicesOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {servicesOpen && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] py-1 shadow-lg">
                        {services.map((service) => (
                          <label
                            key={service._id}
                            className="flex items-center gap-3 cursor-pointer px-3 py-2 transition-colors duration-200 hover:bg-[color:var(--muted)]"
                          >
                            <input
                              type="checkbox"
                              checked={formServices.includes(service.name)}
                              onChange={() => toggleService(service.name)}
                              className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--primary)] accent-[color:var(--primary)]"
                            />
                            <span className="text-sm text-[color:var(--foreground)]">
                              {service.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {formRole.toLowerCase() !== "admin" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[color:var(--foreground)]">
                    Websites Access
                  </label>
                  <div className="relative" ref={websitesRef}>
                    <button
                      type="button"
                      onClick={() => setWebsitesOpen(!websitesOpen)}
                      className="flex cursor-pointer h-10 w-full items-center justify-between rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
                    >
                      <span
                        className={cn(
                          formWebsites.length === 0 &&
                            "text-[color:var(--muted-foreground)]",
                        )}
                      >
                        {formWebsites.length === 0
                          ? "Select websites"
                          : `${formWebsites.length} website${formWebsites.length > 1 ? "s" : ""} selected`}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-[color:var(--muted-foreground)] transition-transform duration-200",
                          websitesOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {websitesOpen && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] py-1 shadow-lg max-h-48 overflow-y-auto">
                        {allWebsites.length > 0 ? (
                          allWebsites.map((website) => (
                            <label
                              key={website._id}
                              className="flex items-center gap-3 cursor-pointer px-3 py-2 transition-colors duration-200 hover:bg-[color:var(--muted)]"
                            >
                              <input
                                type="checkbox"
                                checked={formWebsites.includes(website.name)}
                                onChange={() => toggleWebsite(website.name)}
                                className="h-4 w-4 rounded border-[color:var(--border)] text-[color:var(--primary)] accent-[color:var(--primary)]"
                              />
                              <span className="text-sm text-[color:var(--foreground)]">
                                {website.name}
                              </span>
                            </label>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-[color:var(--muted-foreground)]">
                            No websites available
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="cursor-pointer"
                  onClick={handleSave}
                  disabled={savingUser}
                >
                  {savingUser ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingUser ? (
                    "Save Changes"
                  ) : (
                    "Add User"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowRoleModal(false);
              setEditingRoleId(null);
              setEditRoleName("");
            }}
            aria-hidden="true"
          />
          <Card className="relative z-10 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                Manage Roles
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setEditingRoleId(null);
                  setEditRoleName("");
                }}
                className="rounded-lg p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                aria-label="Close"
              >
                <X className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="space-y-1.5">
                  {rolesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex animate-pulse items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2"
                      >
                        <div className="h-4 w-24 rounded bg-[color:var(--muted)]" />
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded bg-[color:var(--muted)]" />
                          <div className="h-6 w-6 rounded bg-[color:var(--muted)]" />
                        </div>
                      </div>
                    ))
                  ) : roles.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]">
                      No roles found
                    </div>
                  ) : (
                    roles.map((role) => (
                      <div
                        key={role._id}
                        className="flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2"
                      >
                        {editingRoleId === role._id ? (
                          <input
                            type="text"
                            value={editRoleName}
                            onChange={(e) => setEditRoleName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateRole();
                              if (e.key === "Escape") {
                                setEditingRoleId(null);
                                setEditRoleName("");
                              }
                            }}
                            disabled={updatingRole}
                            autoFocus
                            className="h-7 flex-1 mr-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-2 text-sm text-[color:var(--foreground)] outline-none focus:ring-2 focus:ring-[color:var(--primary)] disabled:opacity-50"
                          />
                        ) : (
                          <span className="text-sm text-[color:var(--foreground)]">
                            {role.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {editingRoleId === role._id ? (
                            <>
                              <button
                                type="button"
                                onClick={handleUpdateRole}
                                disabled={updatingRole}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--success)] disabled:opacity-50"
                                aria-label="Save role"
                              >
                                {updatingRole ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin cursor-pointer" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-[color:var(--success)] cursor-pointer" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(null);
                                  setEditRoleName("");
                                }}
                                disabled={updatingRole}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--foreground)] disabled:opacity-50"
                                aria-label="Cancel editing"
                              >
                                <X className="h-3.5 w-3.5 cursor-pointer" />
                              </button>
                            </>
                          ) : role.name.toLowerCase() === "admin" ? (
                            <span className="text-xs text-[color:var(--muted-foreground)]">Protected</span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(role._id);
                                  setEditRoleName(role.name);
                                }}
                                disabled={deletingRoleId === role._id}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--foreground)] disabled:opacity-50"
                                aria-label={`Edit ${role.name} role`}
                              >
                                <Pencil className="h-3.5 w-3.5 cursor-pointer" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role._id)}
                                disabled={deletingRoleId === role._id}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--error)] disabled:opacity-50"
                                aria-label={`Delete ${role.name} role`}
                              >
                                {deletingRoleId === role._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin cursor-pointer" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-[color:var(--error)] cursor-pointer" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <hr className="my-4 border-[color:var(--border)]" />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-role"
                  className="text-sm font-medium text-[color:var(--foreground)]"
                >
                  New Role Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="new-role"
                    type="text"
                    placeholder="e.g. Manager"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddRole()}
                    disabled={addingRole}
                    className="flex h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] disabled:opacity-50"
                  />
                  <Button
                    onClick={handleAddRole}
                    disabled={addingRole}
                    className="shrink-0 cursor-pointer"
                  >
                    {addingRole ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => {
                    setShowRoleModal(false);
                    setEditingRoleId(null);
                    setEditRoleName("");
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setShowServiceModal(false);
              setEditingServiceId(null);
              setEditServiceName("");
            }}
            aria-hidden="true"
          />
          <Card className="relative z-10 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                Manage Services
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowServiceModal(false);
                  setEditingServiceId(null);
                  setEditServiceName("");
                }}
                className="rounded-lg p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                aria-label="Close"
              >
                <X className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <div className="space-y-1.5">
                  {servicesLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex animate-pulse items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2"
                      >
                        <div className="h-4 w-24 rounded bg-[color:var(--muted)]" />
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded bg-[color:var(--muted)]" />
                          <div className="h-6 w-6 rounded bg-[color:var(--muted)]" />
                        </div>
                      </div>
                    ))
                  ) : services.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[color:var(--border)] px-3 py-6 text-center text-sm text-[color:var(--muted-foreground)]">
                      No services found
                    </div>
                  ) : (
                    services.map((service) => (
                      <div
                        key={service._id}
                        className="flex items-center justify-between rounded-lg border border-[color:var(--border)] px-3 py-2"
                      >
                        {editingServiceId === service._id ? (
                          <input
                            type="text"
                            value={editServiceName}
                            onChange={(e) => setEditServiceName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdateService();
                              if (e.key === "Escape") {
                                setEditingServiceId(null);
                                setEditServiceName("");
                              }
                            }}
                            disabled={updatingService}
                            autoFocus
                            className="h-7 flex-1 mr-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-2 text-sm text-[color:var(--foreground)] outline-none focus:ring-2 focus:ring-[color:var(--primary)] disabled:opacity-50"
                          />
                        ) : (
                          <span className="text-sm text-[color:var(--foreground)]">
                            {service.name}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          {editingServiceId === service._id ? (
                            <>
                              <button
                                type="button"
                                onClick={handleUpdateService}
                                disabled={updatingService}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--success)] disabled:opacity-50"
                                aria-label="Save service"
                              >
                                {updatingService ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin cursor-pointer" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-[color:var(--success)] cursor-pointer" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingServiceId(null);
                                  setEditServiceName("");
                                }}
                                disabled={updatingService}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--foreground)] disabled:opacity-50"
                                aria-label="Cancel editing"
                              >
                                <X className="h-3.5 w-3.5 cursor-pointer" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingServiceId(service._id);
                                  setEditServiceName(service.name);
                                }}
                                disabled={deletingServiceId === service._id}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--foreground)] disabled:opacity-50"
                                aria-label={`Edit ${service.name} service`}
                              >
                                <Pencil className="h-3.5 w-3.5 cursor-pointer" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteService(service._id)}
                                disabled={deletingServiceId === service._id}
                                className="rounded p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:text-[color:var(--error)] disabled:opacity-50"
                                aria-label={`Delete ${service.name} service`}
                              >
                                {deletingServiceId === service._id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin cursor-pointer" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5 text-[color:var(--error)] cursor-pointer" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="new-service"
                  className="text-sm font-medium text-[color:var(--foreground)]"
                >
                  New Service Name
                </label>
                <div className="flex gap-2">
                  <input
                    id="new-service"
                    type="text"
                    placeholder="e.g. Content Writing"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddService()}
                    disabled={addingService}
                    className="flex h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] disabled:opacity-50"
                  />
                  <Button
                    onClick={handleAddService}
                    disabled={addingService}
                    className="shrink-0 cursor-pointer"
                  >
                    {addingService ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Add"
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => {
                    setShowServiceModal(false);
                    setEditingServiceId(null);
                    setEditServiceName("");
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              if (!confirmDialog.loading)
                setConfirmDialog((p) => ({ ...p, open: false }));
            }}
            aria-hidden="true"
          />
          <Card className="relative z-10 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 border-b border-[color:var(--border)] pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--error)]/10">
                <Trash2 className="h-5 w-5 text-[color:var(--error)]" />
              </div>
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                {confirmDialog.title}
              </h2>
            </div>
            <p className="pt-4 text-sm text-[color:var(--muted-foreground)]">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-3 pt-6">
              <Button
                variant="ghost"
                className="cursor-pointer"
                disabled={confirmDialog.loading}
                onClick={() => setConfirmDialog((p) => ({ ...p, open: false }))}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer bg-[color:var(--error)] text-white hover:bg-[color:var(--error)]/90"
                disabled={confirmDialog.loading}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
