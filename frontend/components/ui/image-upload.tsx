"use client"

import { useRef, useState } from "react"
import { Camera } from "lucide-react"
import axios from "axios"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

interface ImageUploadProps {
  url: string
  fallback: string
  endpoint: string
  fieldName?: string
  onUploaded: (imageUrl: string) => void
  size?: number
  className?: string
}

export function ImageUpload({
  url,
  fallback,
  endpoint,
  fieldName = "profilePicture",
  onUploaded,
  size = 80,
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append(fieldName, file)
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("access_token")}`,
            "Content-Type": "multipart/form-data",
          },
        },
      )
      if (res.data.success) {
        onUploaded(res.data.profilePicture || res.data.imageUrl || "")
        toast.success(res.data.message || "Image uploaded!")
      } else {
        toast.error(res.data.message || "Failed to upload image")
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload image")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      {url ? (
        <img
          src={url}
          alt="Uploaded"
          style={{ width: size, height: size }}
          className="rounded-full object-cover"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center rounded-full bg-[color:var(--primary)] text-2xl font-bold text-[color:var(--primary-foreground)]"
        >
          {fallback}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        aria-label="Upload image"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[color:var(--card)] bg-[color:var(--primary)] text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--secondary)] cursor-pointer disabled:opacity-50"
      >
        {uploading ? (
          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[color:var(--primary-foreground)] border-t-transparent" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
