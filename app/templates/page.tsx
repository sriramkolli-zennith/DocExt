"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Copy, Trash2, Share2, Edit2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

interface Template {
  id: string
  name: string
  description: string | null
  fields: any[]
  is_public: boolean
  created_at: string
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [showNewForm, setShowNewForm] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Database error:", error.message)
        setTemplates([])
      } else {
        setTemplates(data || [])
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTemplateName.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("templates").insert({
        user_id: user.id,
        name: newTemplateName,
        description: newTemplateDescription || null,
        fields: [],
        is_public: false,
      })

      if (error) throw error

      setNewTemplateName("")
      setNewTemplateDescription("")
      setShowNewForm(false)
      fetchTemplates()
    } catch (error) {
      console.error("Failed to create template:", error)
    }
  }

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("templates").insert({
        user_id: user.id,
        name: `${template.name} (Copy)`,
        description: template.description,
        fields: template.fields,
        is_public: false,
      })

      if (error) throw error
      fetchTemplates()
    } catch (error) {
      console.error("Failed to duplicate template:", error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm("Delete this template?")) return

    try {
      const { error } = await supabase.from("templates").delete().eq("id", templateId)
      if (error) throw error
      setTemplates(templates.filter((t) => t.id !== templateId))
    } catch (error) {
      console.error("Failed to delete template:", error)
    }
  }

  const handleTogglePublic = async (template: Template) => {
    try {
      const { error } = await supabase
        .from("templates")
        .update({ is_public: !template.is_public })
        .eq("id", template.id)

      if (error) throw error
      fetchTemplates()
    } catch (error) {
      console.error("Failed to update template:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-background to-muted">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted">
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <Link href="/dashboard" className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Field Templates</h1>
            <p className="text-muted-foreground">Save and reuse field configurations for faster extractions</p>
          </div>
          <Button onClick={() => setShowNewForm(true)} className="gap-2">
            <Plus className="h-5 w-5" />
            New Template
          </Button>
        </div>

        {/* New Template Form */}
        {showNewForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Invoice Fields"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="What is this template for?"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit">Create Template</Button>
                  <Button type="button" variant="outline" onClick={() => setShowNewForm(false)} className="bg-transparent">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No templates yet. Create one to get started!</p>
              <Button onClick={() => setShowNewForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.fields.length} field{template.fields.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.is_public && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Public</span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                      className="flex-1 gap-1"
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePublic(template)}
                      className="flex-1 gap-1"
                    >
                      <Share2 className="h-4 w-4" />
                      {template.is_public ? "Private" : "Share"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
