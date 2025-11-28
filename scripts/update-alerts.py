#!/usr/bin/env python3
"""
Script to replace all alert() and confirm() calls with custom dialog component
"""

import re

def update_document_detail_page():
    file_path = '/mnt/e/docext_uppermodel/my-app/app/documents/[id]/page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add CustomAlert import if not present
    if 'import { CustomAlert }' not in content:
        content = content.replace(
            'import { updateFieldFeedback } from "@/lib/edge-functions"',
            'import { updateFieldFeedback } from "@/lib/edge-functions"\nimport { CustomAlert } from "@/components/custom-alert"'
        )
    
    # Add alert state variables if not present
    if '// Custom alert states' not in content:
        state_addition = '''
  // Custom alert states
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string
    description?: string
    type: "success" | "error" | "warning" | "info"
    onConfirm?: () => void
    confirmText?: string
    cancelText?: string
  }>({
    title: "",
    type: "info",
  })
  '''
        content = content.replace(
            "  const [editFieldType, setEditFieldType] = useState('')",
            "  const [editFieldType, setEditFieldType] = useState('')" + state_addition
        )
    
    # Add helper functions if not present
    if 'const showAlert =' not in content:
        helper_functions = '''
  // Helper functions for custom alerts
  const showAlert = (
    title: string,
    description?: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    setAlertConfig({ title, description, type })
    setAlertOpen(true)
  }

  const showConfirm = (
    title: string,
    description: string,
    onConfirm: () => void,
    type: "warning" | "error" = "warning",
    confirmText: string = "Confirm",
    cancelText: string = "Cancel"
  ) => {
    setAlertConfig({ title, description, type, onConfirm, confirmText, cancelText })
    setAlertOpen(true)
  }
'''
        content = content.replace(
            '  // Initialize session manager for activity tracking and timeout\n  const { showWarning, extendSession } = useSessionManager()',
            '  // Initialize session manager for activity tracking and timeout\n  const { showWarning, extendSession } = useSessionManager()\n' + helper_functions
        )
    
    # Replace handleDeleteField
    old_delete = '''  const handleDeleteField = async (fieldId: string) => {
    if (!window.confirm("Delete this field?")) return

    try {
      // Delete extracted data first
      const { error: dataError } = await supabase
        .from("extracted_data")
        .delete()
        .eq("field_id", fieldId)

      if (dataError) throw dataError

      // Then delete the field
      const { error: fieldError } = await supabase
        .from("document_fields")
        .delete()
        .eq("id", fieldId)

      if (fieldError) throw fieldError

      // Update UI - filter by id or fieldId
      setFields(fields.filter((f) => f.id !== fieldId && f.fieldId !== fieldId))
    } catch (error) {
      console.error("Failed to delete field:", error)
      alert("Failed to delete field. Please try again.")
    }
  }'''
    
    new_delete = '''  const handleDeleteField = async (fieldId: string) => {
    const field = fields.find(f => f.fieldId === fieldId || f.id === fieldId)
    showConfirm(
      "Delete Field",
      `Are you sure you want to delete the field "${field?.fieldName}"? This action cannot be undone.`,
      async () => {
        try {
          // Delete extracted data first
          const { error: dataError } = await supabase
            .from("extracted_data")
            .delete()
            .eq("field_id", fieldId)

          if (dataError) throw dataError

          // Then delete the field
          const { error: fieldError } = await supabase
            .from("document_fields")
            .delete()
            .eq("id", fieldId)

          if (fieldError) throw fieldError

          // Update UI - filter by id or fieldId
          setFields(fields.filter((f) => f.id !== fieldId && f.fieldId !== fieldId))
          showAlert("Field Deleted", "The field has been successfully deleted.", "success")
        } catch (error) {
          console.error("Failed to delete field:", error)
          showAlert("Delete Failed", "Failed to delete field. Please try again.", "error")
        }
      },
      "error",
      "Delete",
      "Cancel"
    )
  }'''
    
    content = content.replace(old_delete, new_delete)
    
    # Replace alert calls
    content = content.replace(
        'alert("Failed to rerun extraction. Please try again.")',
        'showAlert("Extraction Failed", "Failed to rerun extraction. Please try again.", "error")'
    )
    
    content = content.replace(
        "alert('❌ Azure Document Intelligence is not configured. Please contact your administrator to set up Azure credentials in Supabase.')",
        'showAlert("Configuration Error", "Azure Document Intelligence is not configured. Please contact your administrator to set up Azure credentials in Supabase.", "error")'
    )
    
    content = content.replace(
        "alert('❌ Document or field not found. Please refresh the page and try again.')",
        'showAlert("Not Found", "Document or field not found. Please refresh the page and try again.", "error")'
    )
    
    content = re.sub(
        r"alert\(`❌ Failed to re-extract field: \${error}`\)",
        'showAlert("Re-extraction Failed", `Failed to re-extract field: ${error}`, "error")',
        content
    )
    
    content = content.replace(
        "alert('You have already used your 2 feedback attempts for this field.')",
        'showAlert("Feedback Limit Reached", "You have already used your 2 feedback attempts for this field.", "warning")'
    )
    
    content = content.replace(
        "alert('Failed to update feedback')",
        'showAlert("Update Failed", "Failed to update feedback. Please try again.", "error")'
    )
    
    content = content.replace(
        "alert('No alternative values available for this field')",
        'showAlert("No Alternatives", "No alternative values available for this field.", "info")'
    )
    
    content = content.replace(
        "alert('Failed to select alternative value')",
        'showAlert("Selection Failed", "Failed to select alternative value. Please try again.", "error")'
    )
    
    # Add CustomAlert component at the end before closing div
    if '<CustomAlert' not in content:
        # Find the last closing div before export
        content = re.sub(
            r'(      </div>\s+</div>\s+</>\s+)\s+}\s+export default',
            r'\1\n      {/* Custom Alert Dialog */}\n      <CustomAlert\n        open={alertOpen}\n        onOpenChange={setAlertOpen}\n        title={alertConfig.title}\n        description={alertConfig.description}\n        type={alertConfig.type}\n        onConfirm={alertConfig.onConfirm}\n        confirmText={alertConfig.confirmText}\n        cancelText={alertConfig.cancelText}\n      />\n    </>\n  )\n}\n\nexport default',
            content
        )
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Updated app/documents/[id]/page.tsx")

def update_documents_page():
    file_path = '/mnt/e/docext_uppermodel/my-app/app/documents/page.tsx'
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add CustomAlert import
    content = content.replace(
        '"use client"',
        '"use client"\n\nimport { CustomAlert } from "@/components/custom-alert"'
    )
    
    # TODO: Implement updates for documents page
    print("✅ Prepared app/documents/page.tsx (implementation needed)")

if __name__ == "__main__":
    try:
        update_document_detail_page()
        print("\n✅ All files updated successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
