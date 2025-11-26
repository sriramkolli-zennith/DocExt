"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ThumbsUp, ThumbsDown, Loader2, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/client"
import { getExtractedData, updateFieldFeedback } from "@/lib/edge-functions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FieldValidationModal from "@/components/field-validation-modal"

interface ExtractedField {
  id: string
  fieldName: string
  value: string
  confidence: number
  pageNumber: number
  boundingBox: number[]
  labelPageNumber: number | null
  labelBoundingBox: number[] | null
  top3Values: string[]
  top3Confidences: number[]
  top3PageNumbers: number[]
  top3BoundingBoxes: number[][]
  top3LabelPageNumbers: number[]
  top3LabelBoundingBoxes: number[][]
  userFeedback: 'thumbs_up' | 'thumbs_down' | null
  isManuallySelected: boolean
  selectedFromTop3Index: number | null
  feedbackTimestamp: string | null
}

interface DocumentData {
  id: string
  name: string
  storagePath: string
  publicUrl: string
  createdAt: string
  extractedFields: ExtractedField[]
}

export default function DocumentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedField, setSelectedField] = useState<ExtractedField | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchDocumentData()
  }, [params.id])

  const fetchDocumentData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await getExtractedData(params.id)

      if (fetchError || !data) {
        setError(fetchError || "Failed to load document data")
        return
      }

      setDocument({
        id: data.document.id,
        name: data.document.name,
        storagePath: data.document.storage_path,
        publicUrl: data.document.public_url,
        createdAt: data.document.created_at,
        extractedFields: data.extractedData.map((field: any) => ({
          id: field.id,
          fieldName: field.field_name,
          value: field.value,
          confidence: field.confidence,
          pageNumber: field.page_number,
          boundingBox: field.bounding_box,
          labelPageNumber: field.label_page_number,
          labelBoundingBox: field.label_bounding_box,
          top3Values: field.top3Values || [],
          top3Confidences: field.top3Confidences || [],
          top3PageNumbers: field.top3PageNumbers || [],
          top3BoundingBoxes: field.top3BoundingBoxes || [],
          top3LabelPageNumbers: field.top3LabelPageNumbers || [],
          top3LabelBoundingBoxes: field.top3LabelBoundingBoxes || [],
          userFeedback: field.userFeedback,
          isManuallySelected: field.isManuallySelected,
          selectedFromTop3Index: field.selectedFromTop3Index,
          feedbackTimestamp: field.feedbackTimestamp,
        })),
      })
    } catch (err) {
      console.error("Error fetching document:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleThumbsUp = async (field: ExtractedField) => {
    try {
      setFeedbackLoading(field.id)
      const { data, error } = await updateFieldFeedback({
        extractedDataId: field.id,
        action: 'thumbs_up',
      })

      if (error) {
        console.error("Error updating feedback:", error)
        alert("Failed to save feedback")
        return
      }

      // Refresh data to show updated feedback
      await fetchDocumentData()
    } catch (err) {
      console.error("Error in thumbs up:", err)
      alert("Failed to save feedback")
    } finally {
      setFeedbackLoading(null)
    }
  }

  const handleThumbsDown = async (field: ExtractedField) => {
    try {
      setFeedbackLoading(field.id)
      const { data, error } = await updateFieldFeedback({
        extractedDataId: field.id,
        action: 'thumbs_down',
      })

      if (error) {
        console.error("Error updating feedback:", error)
        alert("Failed to save feedback")
        setFeedbackLoading(null)
        return
      }

      // Show modal with alternatives if available
      if (field.top3Values && field.top3Values.length > 0) {
        setSelectedField(field)
        setShowModal(true)
      } else {
        alert("No alternative values available for this field")
      }

      // Refresh data
      await fetchDocumentData()
    } catch (err) {
      console.error("Error in thumbs down:", err)
      alert("Failed to save feedback")
    } finally {
      setFeedbackLoading(null)
    }
  }

  const handleSelectAlternative = async (index: number) => {
    if (!selectedField) return

    try {
      const { data, error } = await updateFieldFeedback({
        extractedDataId: selectedField.id,
        action: 'select_from_top3',
        selectedIndex: index,
      })

      if (error) {
        console.error("Error selecting alternative:", error)
        alert("Failed to update field value")
        return
      }

      setShowModal(false)
      setSelectedField(null)
      
      // Refresh data to show updated value
      await fetchDocumentData()
      alert("Field value updated successfully!")
    } catch (err) {
      console.error("Error selecting alternative:", err)
      alert("Failed to update field value")
    }
  }

  const getFeedbackIcon = (field: ExtractedField) => {
    if (feedbackLoading === field.id) {
      return <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    }

    if (field.userFeedback === 'thumbs_up') {
      return <ThumbsUp className="h-4 w-4 text-green-600 fill-green-600" />
    }

    if (field.userFeedback === 'thumbs_down') {
      return <ThumbsDown className="h-4 w-4 text-red-600 fill-red-600" />
    }

    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading document...</span>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error || "Document not found"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">{document.name}</h1>
          <p className="text-gray-600 mt-2">
            Uploaded on {new Date(document.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Document Preview and Extracted Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                PDF viewer with annotations will be displayed here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 min-h-[600px] flex items-center justify-center">
                <p className="text-gray-500">
                  PDF viewer component coming soon...
                  <br />
                  <a
                    href={document.publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View document in new tab
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Extracted Fields</CardTitle>
              <CardDescription>
                Review and validate the extracted information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {document.extractedFields.length === 0 ? (
                  <p className="text-gray-500">No fields extracted yet</p>
                ) : (
                  document.extractedFields.map((field) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 bg-white"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm text-gray-600">
                            {field.fieldName}
                          </h3>
                          <p className="text-lg font-medium mt-1">
                            {field.value || "(empty)"}
                          </p>
                          {field.isManuallySelected && (
                            <p className="text-xs text-blue-600 mt-1">
                              ✓ Manually selected from alternatives (option #{field.selectedFromTop3Index! + 1})
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getFeedbackIcon(field)}
                          {!field.userFeedback && !feedbackLoading && (
                            <>
                              <button
                                onClick={() => handleThumbsUp(field)}
                                className="p-1 hover:bg-green-50 rounded transition-colors"
                                title="Correct value"
                              >
                                <ThumbsUp className="h-4 w-4 text-gray-400 hover:text-green-600" />
                              </button>
                              <button
                                onClick={() => handleThumbsDown(field)}
                                className="p-1 hover:bg-red-50 rounded transition-colors"
                                title="Incorrect value - see alternatives"
                              >
                                <ThumbsDown className="h-4 w-4 text-gray-400 hover:text-red-600" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        <span className="inline-block mr-3">
                          Confidence: {(field.confidence * 100).toFixed(1)}%
                        </span>
                        <span className="inline-block">
                          Page: {field.pageNumber}
                        </span>
                      </div>
                      {field.top3Values && field.top3Values.length > 1 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {field.top3Values.length} alternatives available
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Field Validation Modal */}
      {selectedField && (
        <FieldValidationModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedField(null)
          }}
          fieldName={selectedField.fieldName}
          currentValue={selectedField.value}
          alternatives={selectedField.top3Values.map((value, index) => ({
            value,
            confidence: selectedField.top3Confidences[index],
            pageNumber: selectedField.top3PageNumbers[index],
          }))}
          onSelectAlternative={handleSelectAlternative}
        />
      )}
    </div>
  )
}
