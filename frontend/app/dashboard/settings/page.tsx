"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Cookies from "js-cookie"
import { Camera, User, Save, Lock, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"
import DashboardShell from "@/components/layout/dashboard-shell"

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

interface ProfileData {
  fullname: string
  email: string
  phone: string
  company: string
  bio: string
  profilePicture: string
}

function SettingsContent() {
  const [profile, setProfile] = useState<ProfileData>({
    fullname: "",
    email: "",
    phone: "",
    company: "",
    bio: "",
    profilePicture: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/auth/profile`, authHeaders())
        const data = await res.json()
        if (data.success && data.user) {
          setProfile({
            fullname: data.user.fullname || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            company: data.user.company || "",
            bio: data.user.bio || "",
            profilePicture: data.user.profilePicture || "",
          })
        }
      } catch {
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    if (!profile.fullname.trim()) {
      toast.error("Name is required")
      return
    }
    if (!profile.email.trim()) {
      toast.error("Email is required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${API}/auth/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({
          fullname: profile.fullname,
          email: profile.email,
          phone: profile.phone,
          company: profile.company,
          bio: profile.bio,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPic(true)
    try {
      const formData = new FormData()
      formData.append("profilePicture", file)
      const res = await fetch(`${API}/auth/update-profile-picture`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Cookies.get("access_token")}` },
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setProfile((prev) => ({ ...prev, profilePicture: data.profilePicture }))
        toast.success("Profile picture updated!")
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error("Failed to upload picture")
    } finally {
      setUploadingPic(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword) {
      toast.error("Enter a new password")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setChangingPassword(true)
    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("access_token")}`,
        },
        body: JSON.stringify({ newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message)
        setNewPassword("")
        setConfirmPassword("")
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[color:var(--primary)] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Settings</h1>

      {/* Profile Picture */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--foreground)]">Profile Picture</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            {profile.profilePicture ? (
              <Image
                src={profile.profilePicture}
                alt="Profile"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--primary)]">
                <User className="h-8 w-8 text-[color:var(--primary-foreground)]" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingPic}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-md transition-colors hover:opacity-90 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePictureUpload}
            />
          </div>
          <div>
            <p className="text-sm font-medium capitalize text-[color:var(--foreground)]">{profile.fullname}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">{profile.email}</p>
            {uploadingPic && <p className="mt-1 text-xs text-[color:var(--primary)]">Uploading...</p>}
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--foreground)]">Personal Information</h2>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">Full Name</label>
              <input
                type="text"
                value={profile.fullname}
                onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="Enter phone number"
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">Company</label>
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Enter company name"
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Write a short bio..."
              rows={3}
              className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)] resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[color:var(--primary)] px-5 py-2.5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[color:var(--foreground)]">Change Password</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 pr-10 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[color:var(--foreground)]">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="h-10 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 pr-10 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors focus:border-[color:var(--primary)] focus:ring-1 focus:ring-[color:var(--primary)]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="flex items-center gap-2 rounded-lg bg-[color:var(--primary)] px-5 py-2.5 text-sm font-medium text-[color:var(--primary-foreground)] transition-colors hover:opacity-90 disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsContent />
    </DashboardShell>
  )
}
