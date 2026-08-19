"use client"

import { useState, useEffect } from "react"
import { User, Lock, Bell, Palette, Shield, Eye, EyeOff, Check, RotateCcw, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageUpload } from "@/components/ui/image-upload"
import { cn } from "@/lib/utils"
import axios from "axios"
import toast from "react-hot-toast"
import Cookies from "js-cookie"
import { useTheme } from "@/components/theme-provider"
import { useColors } from "@/components/color-provider"

type TabKey = "profile" | "password" | "notifications" | "appearance" | "security"

const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "password", label: "Password", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "security", label: "Security", icon: Shield },
]

const inputCls = "flex h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 pr-10 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
const selectCls = "h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
const labelCls = "text-sm font-medium text-[color:var(--foreground)]"

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

function PasswordField({ id, label, value, onChange, show, onToggle, placeholder }: {
  id: string; label: string; value: string; onChange: (v: string) => void
  show: boolean; onToggle: () => void; placeholder: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelCls}>{label}</label>
      <div className="relative">
        <input id={id} type={show ? "text" : "password"} placeholder={placeholder}
          value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] cursor-pointer">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-xl px-1 py-3">
      <div>
        <p className="text-sm font-medium text-[color:var(--foreground)]">{label}</p>
        <p className="text-xs text-[color:var(--muted-foreground)]">{description}</p>
      </div>
      <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
        className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          checked ? "bg-[color:var(--primary)]" : "bg-[color:var(--muted-foreground)]/30")}>
        <span className={cn("pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          checked ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  )
}

function SaveBar({ saved, label, onClick, savedLabel = "Saved", isLoading = false }: {
  saved: boolean; label: string; onClick: () => void; savedLabel?: string; isLoading?: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-3 mt-4">
      {saved && <span className="flex items-center gap-1.5 text-sm text-[color:var(--success)]"><Check className="h-4 w-4" /> {savedLabel}</span>}
      <Button onClick={onClick} className="cursor-pointer" isLoading={isLoading}>{label}</Button>
    </div>
  )
}

function SelectField({ id, label, value, onChange, options }: {
  id: string; label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelCls}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("profile")
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", company: "", bio: "" })
  const [profileSaved, setProfileSaved] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [accountRole, setAccountRole] = useState("")
  const [accountJoinedAt, setAccountJoinedAt] = useState("")
  const [profilePicture, setProfilePicture] = useState("")

  const [pw, setPw] = useState({ new: "", confirm: "" })
  const [showPw, setShowPw] = useState({ new: false, confirm: false })
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [savingPassword, setSavingPassword] = useState(false)

  const [notifs, setNotifs] = useState({ email: true, apiAlerts: true, weeklyReport: false })
  const [notifsSaved, setNotifsSaved] = useState(false)
  const [savingNotifs, setSavingNotifs] = useState(false)
  const [loadingNotifs, setLoadingNotifs] = useState(true)

  const { theme, setTheme } = useTheme()
  const { refresh: refreshColors } = useColors()
  const [colors, setColors] = useState({ primary: "", secondary: "", success: "", error: "", warning: "" })
  const [loadingColors, setLoadingColors] = useState(true)
  const [savingColors, setSavingColors] = useState(false)
  const [resettingColors, setResettingColors] = useState(false)
  const [appearanceSaved, setAppearanceSaved] = useState(false)

  const [loginAlerts, setLoginAlerts] = useState(true)
  const [sessionTimeout, setSessionTimeout] = useState("30")
  const [securitySaved, setSecuritySaved] = useState(false)
  const [savingSecurity, setSavingSecurity] = useState(false)
  const [loadingSecurity, setLoadingSecurity] = useState(true)
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  function flash(setter: (v: boolean) => void) { setter(true); setTimeout(() => setter(false), 2000) }
  const upd = <T extends object>(setter: (fn: (p: T) => T) => void, key: keyof T, val: string) =>
    setter((p) => ({ ...p, [key]: val }))

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
          authHeaders(),
        )
        if (res.data.success) {
          const u = res.data.user
          setProfile({
            name: u.fullname || "",
            email: u.email || "",
            phone: u.phone || "",
            company: u.company || "",
            bio: u.bio || "",
          })
          setAccountRole(u.role?.name || "User")
          setAccountJoinedAt(u.joinedAt || "")
          setProfilePicture(u.profilePicture || "")
        }
      } catch {
        toast.error("Failed to load profile")
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  async function handleProfileSave() {
    setSavingProfile(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/update-profile`,
        {
          fullname: profile.name.trim(),
          email: profile.email.trim(),
          phone: profile.phone.trim(),
          company: profile.company.trim(),
          bio: profile.bio.trim(),
        },
        authHeaders(),
      )
      if (res.data.success) {
        const u = res.data.user
        setProfile({
          name: u.fullname || "",
          email: u.email || "",
          phone: u.phone || "",
          company: u.company || "",
          bio: u.bio || "",
        })
        toast.success(res.data.message || "Profile updated!")
        flash(setProfileSaved)
      } else {
        toast.error(res.data.message || "Failed to update profile")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setSavingProfile(false)
    }
  }

  async function handlePasswordSave() {
    setPasswordError("")
    if (pw.new.length < 8) { setPasswordError("Password must be at least 8 characters"); return }
    if (pw.new !== pw.confirm) { setPasswordError("Passwords do not match"); return }

    setSavingPassword(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`,
        { newPassword: pw.new },
        authHeaders(),
      )
      if (res.data.success) {
        setPw({ new: "", confirm: "" })
        toast.success(res.data.message || "Password changed!")
        flash(setPasswordSaved)
      } else {
        setPasswordError(res.data.message || "Failed to change password")
      }
    } catch (err: any) {
      setPasswordError(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setSavingPassword(false)
    }
  }

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`,
          authHeaders(),
        )
        if (res.data.success) {
          const p = res.data.preferences
          setNotifs({ email: p.email, apiAlerts: p.apiAlerts, weeklyReport: p.weeklyReport })
        }
      } catch {} finally {
        setLoadingNotifs(false)
      }
    }
    fetchNotifs()
  }, [])

  async function handleNotifsSave() {
    setSavingNotifs(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/preferences`,
        notifs,
        authHeaders(),
      )
      if (res.data.success) {
        toast.success(res.data.message || "Preferences saved!")
        flash(setNotifsSaved)
      } else {
        toast.error(res.data.message || "Failed to save preferences")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setSavingNotifs(false)
    }
  }

  useEffect(() => {
    async function fetchColors() {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/appearance`)
        if (res.data.success) setColors(res.data.appearance)
      } catch {} finally {
        setLoadingColors(false)
      }
    }
    fetchColors()
  }, [])

  async function handleColorsSave() {
    setSavingColors(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/appearance/update`,
        colors,
        authHeaders(),
      )
      if (res.data.success) {
        toast.success(res.data.message || "Colors saved!")
        flash(setAppearanceSaved)
        refreshColors()
      } else {
        toast.error(res.data.message || "Failed to save colors")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setSavingColors(false)
    }
  }

  async function handleColorsReset() {
    setResettingColors(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/appearance/reset`,
        {},
        authHeaders(),
      )
      if (res.data.success) {
        setColors({ primary: "", secondary: "", success: "", error: "", warning: "" })
        toast.success(res.data.message || "Colors reset to defaults!")
        refreshColors()
      } else {
        toast.error(res.data.message || "Failed to reset colors")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setResettingColors(false)
    }
  }

  useEffect(() => {
    async function fetchSecurity() {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/security`,
          authHeaders(),
        )
        if (res.data.success) {
          const s = res.data.settings
          setLoginAlerts(s.loginAlerts)
          setSessionTimeout(String(s.sessionTimeout))
        }
      } catch {} finally {
        setLoadingSecurity(false)
      }
    }
    fetchSecurity()
  }, [])

  async function handleSecuritySave() {
    setSavingSecurity(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/security/update`,
        { loginAlerts, sessionTimeout: Number(sessionTimeout) },
        authHeaders(),
      )
      if (res.data.success) {
        toast.success(res.data.message || "Security settings saved!")
        flash(setSecuritySaved)
      } else {
        toast.error(res.data.message || "Failed to save settings")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setSavingSecurity(false)
    }
  }

  async function handleForceLogout() {
    setLoggingOutAll(true)
    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/security/force-logout`,
        {},
        authHeaders(),
      )
      if (res.data.success) {
        toast.success(res.data.message || "All users logged out!")
      } else {
        toast.error(res.data.message || "Failed to logout users")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setLoggingOutAll(false)
    }
  }

  const initials = (profile.name || "A")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const formattedJoinDate = accountJoinedAt
    ? new Date(accountJoinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Settings</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Manage your account and platform preferences</p>
      </div>

      {/* Horizontal Tabs */}
      <Card className="p-2">
        <nav className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-200 cursor-pointer",
                activeTab === tab.key
                  ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]")}>
              <tab.icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </nav>
      </Card>

      {/* Profile */}
      {activeTab === "profile" && (
        <Card>
          <div className="border-b border-[color:var(--border)] pb-4">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Profile Information</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Update your personal details and profile picture</p>
          </div>
          {loadingProfile ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--primary)] border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6 pt-6">
              <div className="flex items-center gap-4">
                <ImageUpload
                  url={profilePicture}
                  fallback={initials}
                  endpoint="/auth/update-profile-picture"
                  onUploaded={(url) => setProfilePicture(url)}
                />
                <div>
                  <p className="text-sm font-medium text-[color:var(--foreground)] capitalize">{profile.name || "User"}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">{accountRole}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input id="p-name" label="Full Name" value={profile.name} onChange={(e) => upd(setProfile, "name", e.target.value)} />
                <Input id="p-email" type="email" label="Email Address" value={profile.email} onChange={(e) => upd(setProfile, "email", e.target.value)} />
                <Input id="p-phone" type="tel" label="Phone Number" value={profile.phone} onChange={(e) => upd(setProfile, "phone", e.target.value)} placeholder="e.g. +92 300 1234567" />
                <Input id="p-company" label="Company" value={profile.company} onChange={(e) => upd(setProfile, "company", e.target.value)} placeholder="Your company name" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="p-bio" className={labelCls}>Bio</label>
                <textarea id="p-bio" rows={3} value={profile.bio} onChange={(e) => upd(setProfile, "bio", e.target.value)}
                  placeholder="Tell us about yourself"
                  className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)] resize-none" />
              </div>
              <SaveBar saved={profileSaved} label="Save Changes" onClick={handleProfileSave} isLoading={savingProfile} />
            </div>
          )}
        </Card>
      )}

      {/* Password */}
      {activeTab === "password" && (
        <Card>
          <div className="border-b border-[color:var(--border)] pb-4">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Change Password</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Update your password to keep your account secure</p>
          </div>
          <div className="max-w-md space-y-4 pt-6">
            <div>
              <PasswordField id="new-pw" label="New Password" placeholder="Enter new password"
                value={pw.new} onChange={(v) => upd(setPw, "new", v)} show={showPw.new} onToggle={() => setShowPw((p) => ({ ...p, new: !p.new }))} />
              {pw.new && (
                <div className="flex items-center gap-2 pt-1.5">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors",
                        pw.new.length >= i * 3
                          ? pw.new.length >= 12 ? "bg-[color:var(--success)]" : pw.new.length >= 8 ? "bg-[color:var(--warning)]" : "bg-[color:var(--error)]"
                          : "bg-[color:var(--muted)]")} />
                    ))}
                  </div>
                  <span className="text-xs text-[color:var(--muted-foreground)]">
                    {pw.new.length >= 12 ? "Strong" : pw.new.length >= 8 ? "Medium" : "Weak"}
                  </span>
                </div>
              )}
            </div>
            <PasswordField id="cfm-pw" label="Confirm New Password" placeholder="Confirm new password"
              value={pw.confirm} onChange={(v) => upd(setPw, "confirm", v)} show={showPw.confirm} onToggle={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))} />
            {passwordError && <p className="text-sm text-[color:var(--error)]">{passwordError}</p>}
            <SaveBar saved={passwordSaved} label="Update Password" onClick={handlePasswordSave} savedLabel="Password Updated" isLoading={savingPassword} />
          </div>
        </Card>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <Card>
          <div className="border-b border-[color:var(--border)] pb-4">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Notification Preferences</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Choose what notifications you want to receive</p>
          </div>
          {loadingNotifs ? (
            <div className="space-y-4 pt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center justify-between py-3">
                  <div>
                    <div className="h-4 w-36 rounded bg-[color:var(--muted)]" />
                    <div className="mt-2 h-3 w-52 rounded bg-[color:var(--muted)]" />
                  </div>
                  <div className="h-6 w-11 rounded-full bg-[color:var(--muted)]" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-1 pt-6">
                <ToggleRow label="Email Notifications" description="Receive notifications via email" checked={notifs.email} onChange={(v) => setNotifs((p) => ({ ...p, email: v }))} />
                <ToggleRow label="API Usage Alerts" description="Get notified when API usage is high or keys expire" checked={notifs.apiAlerts} onChange={(v) => setNotifs((p) => ({ ...p, apiAlerts: v }))} />
                <ToggleRow label="Weekly Summary Report" description="Receive a weekly email with platform stats" checked={notifs.weeklyReport} onChange={(v) => setNotifs((p) => ({ ...p, weeklyReport: v }))} />
              </div>
              <SaveBar saved={notifsSaved} label="Save Preferences" onClick={handleNotifsSave} isLoading={savingNotifs} />
            </>
          )}
        </Card>
      )}

      {/* Appearance */}
      {activeTab === "appearance" && (
        <Card>
          <div className="border-b border-[color:var(--border)] pb-4">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Appearance</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Customize the look and feel of your dashboard</p>
          </div>
          <div className="space-y-6 pt-6">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Theme</label>
              <div className="flex gap-3 max-w-md">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setTheme(t)}
                    className={cn("flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium capitalize transition-colors duration-200 cursor-pointer",
                      theme === t
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                        : "border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:border-[color:var(--primary)]/50")}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-[color:var(--border)] pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className={labelCls}>Brand Colors</label>
                  <p className="mt-0.5 text-sm text-[color:var(--muted-foreground)]">These colors apply across the entire platform</p>
                </div>
                <button
                  type="button"
                  onClick={handleColorsReset}
                  disabled={resettingColors}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] disabled:opacity-50 cursor-pointer"
                >
                  {resettingColors ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  Reset to Default
                </button>
              </div>
              {loadingColors ? (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 w-16 rounded bg-[color:var(--muted)] mb-2" />
                      <div className="h-12 rounded-xl bg-[color:var(--muted)]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  {([
                    { key: "primary" as const, label: "Primary", fallback: "#C6FF34" },
                    { key: "secondary" as const, label: "Secondary", fallback: "#A8D92B" },
                    { key: "success" as const, label: "Success", fallback: "#C6FF34" },
                    { key: "error" as const, label: "Error", fallback: "#F0637C" },
                    { key: "warning" as const, label: "Warning", fallback: "#F5A76C" },
                  ]).map(({ key, label, fallback }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-[color:var(--muted-foreground)]">{label}</label>
                      <div className="relative">
                        <input
                          type="color"
                          value={colors[key] || fallback}
                          onChange={(e) => setColors((p) => ({ ...p, [key]: e.target.value }))}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div
                          className="flex h-12 items-center gap-2 rounded-xl border border-[color:var(--border)] px-3 transition-colors hover:border-[color:var(--primary)]/50 cursor-pointer"
                        >
                          <div
                            className="h-6 w-6 shrink-0 rounded-lg border border-[color:var(--border)]"
                            style={{ backgroundColor: colors[key] || `var(--${key})` }}
                          />
                          <span className="text-xs font-mono text-[color:var(--muted-foreground)] uppercase">
                            {colors[key] || "Default"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SaveBar saved={appearanceSaved} label="Save Colors" onClick={handleColorsSave} isLoading={savingColors} />
          </div>
        </Card>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <Card>
          <div className="border-b border-[color:var(--border)] pb-4">
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Security Settings</h2>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Manage global security and access controls for all users</p>
          </div>
          {loadingSecurity ? (
            <div className="space-y-4 pt-6">
              <div className="flex animate-pulse items-center justify-between py-3">
                <div>
                  <div className="h-4 w-28 rounded bg-[color:var(--muted)]" />
                  <div className="mt-2 h-3 w-52 rounded bg-[color:var(--muted)]" />
                </div>
                <div className="h-6 w-11 rounded-full bg-[color:var(--muted)]" />
              </div>
              <div className="animate-pulse">
                <div className="h-4 w-28 rounded bg-[color:var(--muted)] mb-2" />
                <div className="h-10 w-full max-w-md rounded-xl bg-[color:var(--muted)]" />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1 pt-6">
                <ToggleRow label="Login Alerts" description="Get notified of new sign-ins to your account" checked={loginAlerts} onChange={setLoginAlerts} />
              </div>
              <div className="max-w-md pt-4">
                <SelectField id="session-timeout" label="Session Timeout" value={sessionTimeout} onChange={setSessionTimeout}
                  options={[{ value: "15", label: "15 minutes" }, { value: "30", label: "30 minutes" }, { value: "60", label: "1 hour" }, { value: "120", label: "2 hours" }, { value: "480", label: "8 hours" }]} />
              </div>
              <SaveBar saved={securitySaved} label="Save Settings" onClick={handleSecuritySave} isLoading={savingSecurity} />
            </>
          )}
          <div className="mt-6 border-t border-[color:var(--error)]/20 pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[color:var(--error)]">Force Logout All Users</h3>
                <p className="mt-0.5 text-sm text-[color:var(--muted-foreground)]">Immediately log out every user from the platform</p>
              </div>
              <Button
                onClick={handleForceLogout}
                disabled={loggingOutAll}
                className="cursor-pointer shrink-0 bg-[color:var(--error)] text-white hover:bg-[color:var(--error)]/90"
              >
                {loggingOutAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Logout All Users"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Account Details */}
      <Card>
        <div className="border-b border-[color:var(--border)] pb-4">
          <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Account Details</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
          {[
            ["Account Type", accountRole || "—"],
            ["Email", profile.email || "—"],
            ["Member Since", formattedJoinDate],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <p className="text-xs text-[color:var(--muted-foreground)]">{lbl}</p>
              <p className="mt-0.5 text-sm font-medium text-[color:var(--foreground)]">{val}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-[color:var(--error)]/30">
        <div className="border-b border-[color:var(--error)]/20 pb-4">
          <h2 className="text-lg font-semibold text-[color:var(--error)]">Danger Zone</h2>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Irreversible actions for your account</p>
        </div>
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[color:var(--foreground)]">Delete Account</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Permanently delete your account and all data</p>
          </div>
          <Button variant="outline" className="shrink-0 border-[color:var(--error)] text-[color:var(--error)] hover:bg-[color:var(--error)] hover:text-white cursor-pointer">
            Delete Account
          </Button>
        </div>
      </Card>
    </div>
  )
}
