"use client"

import { useState, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormTemplate, FormField, FormCategory, FieldType } from "@/types/forms"
import { FieldEditor } from "./field-editor"
import { PlusCircle, AlertTriangle, Save } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"

interface FormBuilderProps {
  formTemplate: FormTemplate;
  onChange: (updatedTemplate: FormTemplate) => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function FormBuilder({ 
  formTemplate, 
  onChange, 
  onSave, 
  isSaving = false 
}: FormBuilderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [fields, setFields] = useState<FormField[]>(formTemplate.fields || [])
  const [showVersionAlert, setShowVersionAlert] = useState(false)
  
  // Keep track of new fields for safeguards
  const [newFieldIds, setNewFieldIds] = useState<string[]>([])
  
  // Update parent when fields change
  useEffect(() => {
    if (isEditing) {
      onChange({
        ...formTemplate,
        fields: fields,
        updatedAt: new Date()
      })
    }
  }, [fields, isEditing])
  
  // Initialize field tracking on mount
  useEffect(() => {
    if (formTemplate.fields) {
      setFields(formTemplate.fields)
    }
  }, [formTemplate.id])
  
  // Flag fields as new when added
  const addField = (type: FieldType) => {
    const newFieldId = uuidv4()
    setNewFieldIds(prev => [...prev, newFieldId])
    
    const newField: FormField = {
      id: newFieldId,
      type,
      label: "",
      placeholder: "",
      helpText: "",
      required: false,
      order: fields.length,
      options: type === 'select' || type === 'multiselect' || type === 'radio' ? [
        { label: "Option 1", value: "option_1" }
      ] : undefined
    }
    
    setFields(prev => [...prev, newField])
    setIsEditing(true)
  }
  
  const updateField = (index: number, updatedField: FormField) => {
    const newFields = [...fields]
    newFields[index] = updatedField
    setFields(newFields)
    setIsEditing(true)
  }
  
  const removeField = (index: number) => {
    // Check if this is an existing field or new field
    const fieldId = fields[index].id
    const isNewField = newFieldIds.includes(fieldId)
    
    if (isNewField) {
      // If it's a new field, just remove it
      setFields(fields.filter((_, i) => i !== index))
      setNewFieldIds(newFieldIds.filter(id => id !== fieldId))
    } else {
      // If it's an existing field, show version warning
      setShowVersionAlert(true)
      
      // For existing fields, we'd either:
      // 1. Mark as deprecated but keep in schema
      // 2. Create a new form version
      // 3. Archive for historical access
      
      // For now, let's just hide it
      const updatedFields = [...fields]
      updatedFields[index] = {
        ...updatedFields[index],
        deprecated: true
      }
      setFields(updatedFields)
    }
    
    setIsEditing(true)
  }
  
  const duplicateField = (index: number) => {
    const fieldToDuplicate = fields[index]
    const newFieldId = uuidv4()
    
    // Create a duplicate with a new ID
    const duplicatedField: FormField = {
      ...JSON.parse(JSON.stringify(fieldToDuplicate)), // Deep clone
      id: newFieldId,
      label: `${fieldToDuplicate.label} (Copy)`,
      order: fields.length
    }
    
    // Mark as new field
    setNewFieldIds(prev => [...prev, newFieldId])
    
    // Add to fields
    setFields(prev => [...prev, duplicatedField])
    setIsEditing(true)
  }
  
  const handleDragEnd = (result: any) => {
    if (!result.destination) return
    
    const reorderedFields = Array.from(fields)
    const [removed] = reorderedFields.splice(result.source.index, 1)
    reorderedFields.splice(result.destination.index, 0, removed)
    
    // Update order property for each field
    const updatedFields = reorderedFields.map((field, index) => ({
      ...field,
      order: index
    }))
    
    setFields(updatedFields)
    setIsEditing(true)
  }
  
  const handleFormDetailsChange = (key: keyof FormTemplate, value: any) => {
    onChange({
      ...formTemplate,
      [key]: value,
      updatedAt: new Date()
    })
    setIsEditing(true)
  }
  
  // Filter out deprecated fields for display
  const activeFields = fields.filter(field => !field.deprecated)
  
  return (
    <div className="space-y-8">
      {showVersionAlert && (
        <Alert variant="warning" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning: Form Structure Change</AlertTitle>
          <AlertDescription>
            Removing or significantly changing existing fields can affect historical data.
            Consider creating a new form version instead.
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowVersionAlert(false)}>
              Continue Anyway
            </Button>
            <Button variant="default" size="sm" onClick={() => {
              // Logic to create a new form version would go here
              setShowVersionAlert(false)
            }}>
              Create New Version
            </Button>
          </div>
        </Alert>
      )}
      
      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>Basic information about your form</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  value={formTemplate.name}
                  onChange={(e) => handleFormDetailsChange("name", e.target.value)}
                  placeholder="Form Name"
                  className="text-lg"
                />
              </div>
              <div>
                <Select
                  value={formTemplate.category}
                  onValueChange={(value) => handleFormDetailsChange("category", value as FormCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incident">Incident Report</SelectItem>
                    <SelectItem value="recognition">Employee Recognition</SelectItem>
                    <SelectItem value="heatPrevention">Heat Prevention</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Textarea
                value={formTemplate.description || ""}
                onChange={(e) => handleFormDetailsChange("description", e.target.value)}
                placeholder="Form Description"
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Form Fields */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Form Fields</CardTitle>
            <CardDescription>Add and arrange fields in your form</CardDescription>
          </div>
          <Select onValueChange={(value) => addField(value as FieldType)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Add Field" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Field</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="select">Dropdown</SelectItem>
              <SelectItem value="multiselect">Multi-Select</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="radio">Radio Buttons</SelectItem>
              <SelectItem value="file">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {activeFields.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-md">
              <p className="text-muted-foreground mb-4">No fields added yet</p>
              <Button onClick={() => addField("text")} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Field
              </Button>
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="fields">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {activeFields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <FieldEditor
                              field={field}
                              isNew={newFieldIds.includes(field.id)}
                              onUpdate={(updatedField) => updateField(index, updatedField)}
                              onDelete={() => removeField(index)}
                              onDuplicate={() => duplicateField(index)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
        {onSave && (
          <CardFooter className="flex justify-end">
            <Button onClick={onSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Form"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
} 