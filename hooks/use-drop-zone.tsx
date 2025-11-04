"use client"

import { useCallback } from "react"

export function useDropZone() {
  const [isDragActive, setIsDragActive] = React.useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    return e.dataTransfer.files
  }, [])

  const getRootProps = useCallback(() => {
    return {
      onDragEnter: handleDragIn,
      onDragLeave: handleDragOut,
      onDragOver: handleDrag,
      onDrop: (e: React.DragEvent) => {
        handleDrop(e)
        if (e.dataTransfer.files) {
          setIsDragActive(false)
        }
      },
    }
  }, [handleDragIn, handleDragOut, handleDrag, handleDrop])

  const getInputProps = useCallback(() => {
    return {
      type: "file",
      multiple: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
          // Handle file selection
        }
      },
    }
  }, [])

  return {
    isDragActive,
    getRootProps,
    getInputProps,
  }
}

import React from "react"
