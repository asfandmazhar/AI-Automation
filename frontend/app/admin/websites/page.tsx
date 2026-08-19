"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, X, ExternalLink, ChevronLeft, ChevronRight, Loader2, Globe, Key, Link, CheckCircle2, Unplug, ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import axios from "axios"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

interface GscData {
  connected: boolean
  googleEmail: string
  selectedProperty: string
}

interface GaData {
  connected: boolean
  googleEmail: string
  selectedProperty: string
}

interface WebsiteItem {
  _id: string
  name: string
  url: string
  customFields: { label: string; value: string }[]
  status: "Active" | "Inactive" | "Pending"
  googleSearchConsole?: GscData
  googleAnalytics?: GaData
}

interface GscProperty {
  siteUrl: string
  permissionLevel: string
}

interface GaProperty {
  propertyId: string
  displayName: string
  property: string
  account: string
}

const API = process.env.NEXT_PUBLIC_API_URL
const PER_PAGE = 6

export default function ManageWebsitesPage() {
  return (
    <Suspense>
      <ManageWebsitesContent />
    </Suspense>
  )
}

function ManageWebsitesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [websites, setWebsites] = useState<WebsiteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingWebsite, setEditingWebsite] = useState<WebsiteItem | null>(null)
  const [page, setPage] = useState(1)
  const [saving, setSaving] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    message: string
    onConfirm: () => void
    loading: boolean
  }>({ open: false, title: "", message: "", onConfirm: () => {}, loading: false })

  const [formName, setFormName] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formStatus, setFormStatus] = useState<WebsiteItem["status"]>("Active")
  const [customFields, setCustomFields] = useState<{ label: string; value: string }[]>([])
  const [formErrors, setFormErrors] = useState<{ name?: string; url?: string }>({})

  // GSC state
  const [gscConnecting, setGscConnecting] = useState(false)
  const [gscProperties, setGscProperties] = useState<GscProperty[]>([])
  const [gscLoadingProps, setGscLoadingProps] = useState(false)
  const [gscSelectedProp, setGscSelectedProp] = useState("")
  const [gscSavingProp, setGscSavingProp] = useState(false)
  const [gscDisconnecting, setGscDisconnecting] = useState(false)
  const [gscShowDropdown, setGscShowDropdown] = useState(false)

  // GA state
  const [gaConnecting, setGaConnecting] = useState(false)
  const [gaProperties, setGaProperties] = useState<GaProperty[]>([])
  const [gaLoadingProps, setGaLoadingProps] = useState(false)
  const [gaSelectedProp, setGaSelectedProp] = useState("")
  const [gaSavingProp, setGaSavingProp] = useState(false)
  const [gaDisconnecting, setGaDisconnecting] = useState(false)
  const [gaShowDropdown, setGaShowDropdown] = useState(false)
  const [gaHint, setGaHint] = useState("")

  const totalPages = Math.max(1, Math.ceil(websites.length / PER_PAGE))
  const paginated = websites.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const startIdx = (page - 1) * PER_PAGE + 1
  const endIdx = Math.min(page * PER_PAGE, websites.length)
  const safePage = Math.min(page, totalPages)

  const fetchWebsites = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/websites/get-all`, authHeaders())
      if (res.data.success) {
        setWebsites(res.data.websites)
        return res.data.websites as WebsiteItem[]
      } else {
        toast.error(res.data.message || "Failed to fetch websites")
      }
    } catch {
      toast.error("Failed to connect to server")
    } finally {
      setLoading(false)
    }
    return [] as WebsiteItem[]
  }, [])

  useEffect(() => {
    fetchWebsites().then((sites) => {
      const gsc = searchParams.get("gsc")
      const ga = searchParams.get("ga")
      const wId = searchParams.get("websiteId")

      if (gsc && wId) {
        window.history.replaceState({}, "", "/admin/websites")

        if (gsc === "success") {
          toast.success("Google Search Console connected!")
          const site = sites.find((w: WebsiteItem) => w._id === wId)
          if (site) {
            openEdit({
              ...site,
              googleSearchConsole: {
                ...(site.googleSearchConsole || { connected: false, googleEmail: "", selectedProperty: "" }),
                connected: true,
              },
            })
            loadProperties(wId)
          }
        } else if (gsc === "error") {
          toast.error("Failed to connect Google Search Console")
        }
      }

      if (ga && wId) {
        window.history.replaceState({}, "", "/admin/websites")

        if (ga === "success") {
          toast.success("Google Analytics connected!")
          const site = sites.find((w: WebsiteItem) => w._id === wId)
          if (site) {
            openEdit({
              ...site,
              googleAnalytics: {
                ...(site.googleAnalytics || { connected: false, googleEmail: "", selectedProperty: "" }),
                connected: true,
              },
            })
            loadGaProperties(wId)
          }
        } else if (ga === "error") {
          toast.error("Failed to connect Google Analytics")
        }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function resetForm() {
    setFormName("")
    setFormUrl("")
    setFormStatus("Active")
    setCustomFields([])
    setFormErrors({})
    setGscProperties([])
    setGscSelectedProp("")
    setGscShowDropdown(false)
    setGaProperties([])
    setGaSelectedProp("")
    setGaShowDropdown(false)
  }

  function openAdd() {
    setEditingWebsite(null)
    resetForm()
    setShowModal(true)
  }

  function openEdit(website: WebsiteItem) {
    setEditingWebsite(website)
    setFormName(website.name)
    setFormUrl(website.url)
    setFormStatus(website.status)
    setCustomFields(website.customFields || [])
    setFormErrors({})
    setGscProperties([])
    setGscSelectedProp(website.googleSearchConsole?.selectedProperty || "")
    setGscShowDropdown(false)
    setGaProperties([])
    setGaSelectedProp(website.googleAnalytics?.selectedProperty || "")
    setGaShowDropdown(false)
    setShowModal(true)
  }

  function validateForm(): boolean {
    const errors: { name?: string; url?: string } = {}
    if (!formName.trim()) errors.name = "Website name is required"
    if (formName.trim() && formName.trim().length < 2) errors.name = "Name must be at least 2 characters"
    if (!formUrl.trim()) errors.url = "URL is required"
    if (formUrl.trim() && !/^https?:\/\/.+/i.test(formUrl.trim())) errors.url = "Please enter a valid URL (e.g. https://example.com)"
    setFormErrors(errors)
    return !errors.name && !errors.url
  }

  async function handleSave() {
    if (!validateForm()) return

    const validCustomFields = customFields.filter((f) => f.label.trim() && f.value.trim())

    setSaving(true)
    try {
      if (editingWebsite) {
        const res = await axios.post(
          `${API}/websites/update`,
          {
            _id: editingWebsite._id,
            name: formName.trim(),
            url: formUrl.trim(),
            customFields: validCustomFields,
            status: formStatus,
          },
          authHeaders(),
        )
        if (res.data.success) {
          setWebsites((prev) =>
            prev.map((w) => w._id === editingWebsite._id ? res.data.website : w)
          )
          setShowModal(false)
          toast.success(res.data.message || "Website updated successfully!")
        } else {
          toast.error(res.data.message || "Failed to update website")
        }
      } else {
        const res = await axios.post(
          `${API}/websites/create`,
          {
            name: formName.trim(),
            url: formUrl.trim(),
            customFields: validCustomFields,
            status: formStatus,
          },
          authHeaders(),
        )
        if (res.data.success) {
          setWebsites((prev) => [...prev, res.data.website])
          setShowModal(false)
          toast.success(res.data.message || "Website created successfully!")
        } else {
          toast.error(res.data.message || "Failed to create website")
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to connect to server")
    } finally {
      setSaving(false)
    }
  }

  function handleDelete(id: string) {
    const website = websites.find((w) => w._id === id)
    setConfirmDialog({
      open: true,
      title: "Delete Website",
      message: `Are you sure you want to delete "${website?.name}"? This action cannot be undone.`,
      loading: false,
      onConfirm: async () => {
        setConfirmDialog((p) => ({ ...p, loading: true }))
        try {
          const res = await axios.delete(
            `${API}/websites/delete`,
            { params: { _id: id }, ...authHeaders() },
          )
          if (res.data.success) {
            setWebsites((prev) => {
              const updated = prev.filter((w) => w._id !== id)
              const newTotal = Math.max(1, Math.ceil(updated.length / PER_PAGE))
              if (page > newTotal) setPage(newTotal)
              return updated
            })
            toast.success(res.data.message || "Website deleted successfully!")
          } else {
            toast.error(res.data.message || "Failed to delete website")
          }
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to connect to server")
        } finally {
          setConfirmDialog((p) => ({ ...p, open: false, loading: false }))
        }
      },
    })
  }

  // ─── GSC helpers ──────────────────────────────────

  async function handleGscConnect() {
    if (!editingWebsite) {
      toast.error("Please save the website first, then edit it to connect Google Search Console.")
      return
    }
    setGscConnecting(true)
    try {
      const res = await axios.get(`${API}/websites/gsc/auth-url`, {
        params: { websiteId: editingWebsite._id },
        ...authHeaders(),
      })
      if (res.data.success) {
        window.location.href = res.data.url
      } else {
        toast.error(res.data.message || "Failed to get auth URL")
        setGscConnecting(false)
      }
    } catch {
      toast.error("Failed to connect to server")
      setGscConnecting(false)
    }
  }

  async function loadProperties(websiteId: string) {
    setGscLoadingProps(true)
    setGscShowDropdown(true)
    try {
      const res = await axios.get(`${API}/websites/gsc/properties`, {
        params: { websiteId },
        ...authHeaders(),
      })
      if (res.data.success) {
        setGscProperties(res.data.properties)
      } else {
        toast.error(res.data.message || "Failed to load properties")
      }
    } catch {
      toast.error("Failed to load Search Console properties")
    } finally {
      setGscLoadingProps(false)
    }
  }

  async function handleSelectProperty(propertyUrl: string) {
    if (!editingWebsite) return
    setGscSavingProp(true)
    try {
      const res = await axios.post(
        `${API}/websites/gsc/select-property`,
        { websiteId: editingWebsite._id, propertyUrl },
        authHeaders(),
      )
      if (res.data.success) {
        setGscSelectedProp(propertyUrl)
        setGscShowDropdown(false)
        setEditingWebsite((prev) =>
          prev ? { ...prev, googleSearchConsole: { ...prev.googleSearchConsole!, selectedProperty: propertyUrl } } : prev
        )
        setWebsites((prev) =>
          prev.map((w) =>
            w._id === editingWebsite._id
              ? { ...w, googleSearchConsole: { ...(w.googleSearchConsole || { connected: true, googleEmail: "" }), selectedProperty: propertyUrl } }
              : w
          )
        )
        toast.success("Property selected!")
      } else {
        toast.error(res.data.message || "Failed to select property")
      }
    } catch {
      toast.error("Failed to save property selection")
    } finally {
      setGscSavingProp(false)
    }
  }

  async function handleGscDisconnect() {
    if (!editingWebsite) return
    setGscDisconnecting(true)
    try {
      const res = await axios.post(
        `${API}/websites/gsc/disconnect`,
        { websiteId: editingWebsite._id },
        authHeaders(),
      )
      if (res.data.success) {
        const cleared: GscData = { connected: false, googleEmail: "", selectedProperty: "" }
        setEditingWebsite((prev) => prev ? { ...prev, googleSearchConsole: cleared } : prev)
        setWebsites((prev) => prev.map((w) => w._id === editingWebsite._id ? { ...w, googleSearchConsole: cleared } : w))
        setGscProperties([])
        setGscSelectedProp("")
        setGscShowDropdown(false)
        toast.success("Google Search Console disconnected!")
      } else {
        toast.error(res.data.message || "Failed to disconnect")
      }
    } catch {
      toast.error("Failed to disconnect")
    } finally {
      setGscDisconnecting(false)
    }
  }

  // ─── GA helpers ───────────────────────────────────

  async function handleGaConnect() {
    if (!editingWebsite) {
      toast.error("Please save the website first, then edit it to connect Google Analytics.")
      return
    }
    setGaConnecting(true)
    try {
      const res = await axios.get(`${API}/websites/ga/auth-url`, {
        params: { websiteId: editingWebsite._id },
        ...authHeaders(),
      })
      if (res.data.success) {
        window.location.href = res.data.url
      } else {
        toast.error(res.data.message || "Failed to get auth URL")
        setGaConnecting(false)
      }
    } catch {
      toast.error("Failed to connect to server")
      setGaConnecting(false)
    }
  }

  async function loadGaProperties(websiteId: string) {
    setGaLoadingProps(true)
    setGaShowDropdown(true)
    setGaHint("")
    try {
      const res = await axios.get(`${API}/websites/ga/properties`, {
        params: { websiteId },
        ...authHeaders(),
      })
      if (res.data.success) {
        setGaProperties(res.data.properties)
        if (res.data.properties.length === 0 && res.data.hint) {
          setGaHint(res.data.hint)
        }
      } else {
        toast.error(res.data.message || "Failed to load properties")
      }
    } catch {
      toast.error("Failed to load Analytics properties")
    } finally {
      setGaLoadingProps(false)
    }
  }

  async function handleSelectGaProperty(propertyId: string) {
    if (!editingWebsite) return
    setGaSavingProp(true)
    try {
      const res = await axios.post(
        `${API}/websites/ga/select-property`,
        { websiteId: editingWebsite._id, propertyId },
        authHeaders(),
      )
      if (res.data.success) {
        setGaSelectedProp(propertyId)
        setGaShowDropdown(false)
        setEditingWebsite((prev) =>
          prev ? { ...prev, googleAnalytics: { ...prev.googleAnalytics!, selectedProperty: propertyId } } : prev
        )
        setWebsites((prev) =>
          prev.map((w) =>
            w._id === editingWebsite._id
              ? { ...w, googleAnalytics: { ...(w.googleAnalytics || { connected: true, googleEmail: "" }), selectedProperty: propertyId } }
              : w
          )
        )
        toast.success("Property selected!")
      } else {
        toast.error(res.data.message || "Failed to select property")
      }
    } catch {
      toast.error("Failed to save property selection")
    } finally {
      setGaSavingProp(false)
    }
  }

  async function handleGaDisconnect() {
    if (!editingWebsite) return
    setGaDisconnecting(true)
    try {
      const res = await axios.post(
        `${API}/websites/ga/disconnect`,
        { websiteId: editingWebsite._id },
        authHeaders(),
      )
      if (res.data.success) {
        const cleared: GaData = { connected: false, googleEmail: "", selectedProperty: "" }
        setEditingWebsite((prev) => prev ? { ...prev, googleAnalytics: cleared } : prev)
        setWebsites((prev) => prev.map((w) => w._id === editingWebsite._id ? { ...w, googleAnalytics: cleared } : w))
        setGaProperties([])
        setGaSelectedProp("")
        setGaShowDropdown(false)
        toast.success("Google Analytics disconnected!")
      } else {
        toast.error(res.data.message || "Failed to disconnect")
      }
    } catch {
      toast.error("Failed to disconnect")
    } finally {
      setGaDisconnecting(false)
    }
  }

  const gscConnected = editingWebsite?.googleSearchConsole?.connected || false
  const gscEmail = editingWebsite?.googleSearchConsole?.googleEmail || ""
  const gaConnected = editingWebsite?.googleAnalytics?.connected || false
  const gaEmail = editingWebsite?.googleAnalytics?.googleEmail || ""

  const statusColors: Record<WebsiteItem["status"], string> = {
    Active: "bg-[color:var(--success)] text-[color:var(--success-foreground)]",
    Inactive: "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]",
    Pending: "bg-[color:var(--warning)] text-[color:var(--accent-white)]",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Manage Websites</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Add, edit, or remove websites from the platform</p>
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Website
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: PER_PAGE }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-4 p-5 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="h-5 w-32 rounded bg-[color:var(--muted)]" />
                  <div className="mt-2 flex items-center gap-1.5">
                    <div className="h-3.5 w-3.5 rounded bg-[color:var(--muted)]" />
                    <div className="h-4 w-44 rounded bg-[color:var(--muted)]" />
                  </div>
                </div>
                <div className="h-5 w-16 rounded-full bg-[color:var(--muted)]" />
              </div>
              <div className="flex items-center gap-2 border-t border-[color:var(--border)] pt-4">
                <div className="h-8 w-16 rounded-lg bg-[color:var(--muted)]" />
                <div className="h-8 w-20 rounded-lg bg-[color:var(--muted)]" />
              </div>
            </Card>
          ))
        ) : (
          <>
            {paginated.map((website) => (
              <Card key={website._id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between">
                  <h3 className="min-w-0 text-base font-semibold text-[color:var(--foreground)]">{website.name}</h3>
                  <span
                    className={cn(
                      "inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      statusColors[website.status]
                    )}
                  >
                    {website.status}
                  </span>
                </div>
                <a href={website.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[color:var(--primary)] hover:underline">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{website.url.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
                </a>

                {/* API badges + GSC badge */}
                <div className="flex flex-wrap gap-1.5">
                  {website.googleSearchConsole?.connected && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      GSC{website.googleSearchConsole.selectedProperty ? ` · ${website.googleSearchConsole.selectedProperty.replace(/^sc-domain:|https?:\/\//g, "").replace(/\/$/, "")}` : ""}
                    </span>
                  )}
                  {website.googleAnalytics?.connected && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      <CheckCircle2 className="h-3 w-3" />
                      GA4{website.googleAnalytics.selectedProperty ? ` · ${website.googleAnalytics.selectedProperty}` : ""}
                    </span>
                  )}
                </div>

                {website.customFields?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {website.customFields.map((field, idx) => (
                      /^https?:\/\//i.test(field.value) ? (
                        <a key={idx} href={field.value} target="_blank" rel="noopener noreferrer" title={field.value} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--primary)] hover:border-[color:var(--primary)] transition-colors">
                          <Link className="h-3 w-3" />{field.label}<ExternalLink className="h-2.5 w-2.5 opacity-60" />
                        </a>
                      ) : (
                        <span key={idx} title={field.value} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--muted-foreground)]">
                          <Key className="h-3 w-3" />{field.label}
                        </span>
                      )
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 border-t border-[color:var(--border)] pt-3">
                  <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => openEdit(website)}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button className="text-[color:var(--error)] cursor-pointer" variant="ghost" size="sm" onClick={() => handleDelete(website._id)}>
                    <Trash2 className="h-4 w-4 text-[color:var(--error)]" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}

            {websites.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-[color:var(--muted-foreground)]">
                No websites added yet
              </div>
            )}
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && websites.length > PER_PAGE && (
        <Card className="p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Showing {startIdx}–{endIdx} of {websites.length} websites
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
                      : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
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
        </Card>
      )}

      {/* Add/Edit Modal */}
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
                {editingWebsite ? "Edit Website" : "Add Website"}
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
                id="website-name"
                label="Website Name"
                placeholder="My Website"
                value={formName}
                onChange={(e) => { setFormName(e.target.value); setFormErrors((p) => ({ ...p, name: undefined })) }}
                error={formErrors.name}
              />
              <Input
                id="website-url"
                type="url"
                label="URL"
                placeholder="https://example.com"
                value={formUrl}
                onChange={(e) => { setFormUrl(e.target.value); setFormErrors((p) => ({ ...p, url: undefined })) }}
                error={formErrors.url}
              />

              {/* ─── Google Search Console Section ─── */}
              <div className="rounded-xl border border-[color:var(--border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">Google Search Console</p>
                  {gscConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />Connected
                    </span>
                  )}
                </div>

                {!gscConnected ? (
                  <div className="space-y-2">
                    {!editingWebsite && (
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        Save this website first, then edit it to connect Google Search Console.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleGscConnect}
                      disabled={gscConnecting || !editingWebsite}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] py-2.5 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {gscConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      {gscConnecting ? "Connecting..." : "Connect Google Search Console"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gscEmail && (
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        Signed in as <span className="font-medium text-[color:var(--foreground)]">{gscEmail}</span>
                      </p>
                    )}

                    {/* Selected property or property picker */}
                    {gscSelectedProp && !gscShowDropdown ? (
                      <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-950">
                        <div className="min-w-0">
                          <p className="text-xs text-[color:var(--muted-foreground)]">Selected Property</p>
                          <p className="truncate text-sm font-medium text-[color:var(--foreground)]">
                            {gscSelectedProp.replace(/^sc-domain:|https?:\/\//g, "").replace(/\/$/, "")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadProperties(editingWebsite!._id)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs text-[color:var(--primary)] hover:bg-[color:var(--muted)] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[color:var(--muted-foreground)]">Select a Search Console property</p>
                          {!gscLoadingProps && gscProperties.length === 0 && !gscShowDropdown && (
                            <button
                              type="button"
                              onClick={() => loadProperties(editingWebsite!._id)}
                              className="text-xs text-[color:var(--primary)] hover:underline cursor-pointer"
                            >
                              Load Properties
                            </button>
                          )}
                        </div>

                        {gscLoadingProps ? (
                          <div className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--muted-foreground)]" />
                            <span className="text-xs text-[color:var(--muted-foreground)]">Loading properties...</span>
                          </div>
                        ) : gscProperties.length > 0 ? (
                          <div className="space-y-1 max-h-40 overflow-y-auto rounded-lg border border-[color:var(--border)]">
                            {gscProperties.map((prop) => (
                              <button
                                key={prop.siteUrl}
                                type="button"
                                disabled={gscSavingProp}
                                onClick={() => handleSelectProperty(prop.siteUrl)}
                                className={cn(
                                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                                  "hover:bg-[color:var(--muted)]",
                                  gscSelectedProp === prop.siteUrl && "bg-[color:var(--muted)]",
                                  gscSavingProp && "opacity-50"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[color:var(--foreground)]">
                                    {prop.siteUrl.replace(/^sc-domain:|https?:\/\//g, "").replace(/\/$/, "")}
                                  </p>
                                  <p className="text-xs text-[color:var(--muted-foreground)]">
                                    {prop.siteUrl.startsWith("sc-domain:") ? "Domain property" : "URL prefix"} · {prop.permissionLevel}
                                  </p>
                                </div>
                                {gscSavingProp && gscSelectedProp === prop.siteUrl && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 ml-2" />
                                )}
                                {!gscSavingProp && gscSelectedProp === prop.siteUrl && (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-2 text-green-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : gscShowDropdown ? (
                          <div className="rounded-lg border border-[color:var(--border)] px-3 py-4 text-center text-xs text-[color:var(--muted-foreground)]">
                            No properties found for this Google account.
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Disconnect */}
                    <button
                      type="button"
                      onClick={handleGscDisconnect}
                      disabled={gscDisconnecting}
                      className="flex items-center gap-1.5 text-xs text-[color:var(--error)] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {gscDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
                      {gscDisconnecting ? "Disconnecting..." : "Disconnect Google Search Console"}
                    </button>
                  </div>
                )}
              </div>

              {/* ─── Google Analytics Section ─── */}
              <div className="rounded-xl border border-[color:var(--border)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[color:var(--foreground)]">Google Analytics</p>
                  {gaConnected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      <CheckCircle2 className="h-3 w-3" />Connected
                    </span>
                  )}
                </div>

                {!gaConnected ? (
                  <div className="space-y-2">
                    {!editingWebsite && (
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        Save this website first, then edit it to connect Google Analytics.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleGaConnect}
                      disabled={gaConnecting || !editingWebsite}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] py-2.5 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {gaConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                      )}
                      {gaConnecting ? "Connecting..." : "Connect Google Analytics"}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gaEmail && (
                      <p className="text-xs text-[color:var(--muted-foreground)]">
                        Signed in as <span className="font-medium text-[color:var(--foreground)]">{gaEmail}</span>
                      </p>
                    )}

                    {gaSelectedProp && !gaShowDropdown ? (
                      <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800 dark:bg-blue-950">
                        <div className="min-w-0">
                          <p className="text-xs text-[color:var(--muted-foreground)]">Selected Property</p>
                          <p className="truncate text-sm font-medium text-[color:var(--foreground)]">
                            {gaSelectedProp}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => loadGaProperties(editingWebsite!._id)}
                          className="shrink-0 rounded-lg px-2 py-1 text-xs text-[color:var(--primary)] hover:bg-[color:var(--muted)] transition-colors cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[color:var(--muted-foreground)]">Select a GA4 property</p>
                          {!gaLoadingProps && gaProperties.length === 0 && !gaShowDropdown && (
                            <button
                              type="button"
                              onClick={() => loadGaProperties(editingWebsite!._id)}
                              className="text-xs text-[color:var(--primary)] hover:underline cursor-pointer"
                            >
                              Load Properties
                            </button>
                          )}
                        </div>

                        {gaLoadingProps ? (
                          <div className="flex items-center justify-center gap-2 rounded-lg border border-[color:var(--border)] py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-[color:var(--muted-foreground)]" />
                            <span className="text-xs text-[color:var(--muted-foreground)]">Loading properties...</span>
                          </div>
                        ) : gaProperties.length > 0 ? (
                          <div className="space-y-1 max-h-40 overflow-y-auto rounded-lg border border-[color:var(--border)]">
                            {gaProperties.map((prop) => (
                              <button
                                key={prop.propertyId}
                                type="button"
                                disabled={gaSavingProp}
                                onClick={() => handleSelectGaProperty(prop.propertyId)}
                                className={cn(
                                  "flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                                  "hover:bg-[color:var(--muted)]",
                                  gaSelectedProp === prop.propertyId && "bg-[color:var(--muted)]",
                                  gaSavingProp && "opacity-50"
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-[color:var(--foreground)]">
                                    {prop.displayName}
                                  </p>
                                  <p className="text-xs text-[color:var(--muted-foreground)]">
                                    {prop.account} · ID: {prop.propertyId}
                                  </p>
                                </div>
                                {gaSavingProp && gaSelectedProp === prop.propertyId && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 ml-2" />
                                )}
                                {!gaSavingProp && gaSelectedProp === prop.propertyId && (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 ml-2 text-blue-600" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : gaShowDropdown ? (
                          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-3 text-xs text-[color:var(--muted-foreground)]">
                            <p className="font-medium text-[color:var(--foreground)]">No GA4 properties found.</p>
                            {gaHint && <p className="mt-1">{gaHint}</p>}
                            {!gaHint && <p className="mt-1">Make sure this Google account has access to a GA4 property and the Google Analytics Admin API is enabled in your Google Cloud project.</p>}
                          </div>
                        ) : null}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleGaDisconnect}
                      disabled={gaDisconnecting}
                      className="flex items-center gap-1.5 text-xs text-[color:var(--error)] hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {gaDisconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
                      {gaDisconnecting ? "Disconnecting..." : "Disconnect Google Analytics"}
                    </button>
                  </div>
                )}
              </div>

              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      id={`custom-label-${idx}`}
                      label={idx === 0 ? "Custom Fields" : ""}
                      placeholder="Label (e.g. Instagram)"
                      value={field.label}
                      onChange={(e) => setCustomFields((prev) => prev.map((f, i) => i === idx ? { ...f, label: e.target.value } : f))}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id={`custom-value-${idx}`}
                      label={idx === 0 ? " " : ""}
                      placeholder="Value (e.g. URL)"
                      value={field.value}
                      onChange={(e) => setCustomFields((prev) => prev.map((f, i) => i === idx ? { ...f, value: e.target.value } : f))}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomFields((prev) => prev.filter((_, i) => i !== idx))}
                    className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--error)] cursor-pointer"
                    aria-label="Remove field"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setCustomFields((prev) => [...prev, { label: "", value: "" }])}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--border)] py-2.5 text-sm text-[color:var(--muted-foreground)] transition-colors hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Custom Field
              </button>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="website-status" className="text-sm font-medium text-[color:var(--foreground)]">
                  Status
                </label>
                <select
                  id="website-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as WebsiteItem["status"])}
                  className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button className="cursor-pointer" onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingWebsite ? "Save Changes" : "Add Website"
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      {confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { if (!confirmDialog.loading) setConfirmDialog((p) => ({ ...p, open: false })) }}
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
  )
}
