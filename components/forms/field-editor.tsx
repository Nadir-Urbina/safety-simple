"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash, GripVertical, AlertTriangle, Lock } from "lucide-react"
import { FormField, FieldType, FieldOption } from "@/types/forms"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FieldEditorProps {
  field: FormField
  isNew: boolean // Whether this field is newly created or existing
  onUpdate: (updatedField: FormField) => void
  onDelete: () => void
  onDuplicate: () => void
}

export function FieldEditor({ field, isNew, onUpdate, onDelete, onDuplicate }: FieldEditorProps) {
  const [currentField, setCurrentField] = useState<FormField>(field)
  const [confirmDelete, setConfirmDelete] = useState(false)
  
  const handleChange = (key: string, value: any) => {
    const updatedField = { ...currentField, [key]: value }
    setCurrentField(updatedField)
    onUpdate(updatedField)
  }
  
  // Field types can only be selected for new fields
  const fieldTypeOptions = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "select", label: "Dropdown Select" },
    { value: "multiselect", label: "Multi-Select" },
    { value: "checkbox", label: "Checkbox" },
    { value: "radio", label: "Radio Buttons" },
    { value: "file", label: "File Upload" }
  ]

  // Get display label for field type
  const getFieldTypeLabel = (type: FieldType) => {
    return fieldTypeOptions.find(option => option.value === type)?.label || type
  }

  return (
    <>
      <Card className={cn(
        "mb-4 border-l-4",
        isNew ? "border-l-green-500" : "border-l-slate-500",
        field.deprecated && "opacity-60"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <div>
                <h3 className="font-medium">{currentField.label || "New Field"}</h3>
                <p className="text-xs text-muted-foreground">
                  {getFieldTypeLabel(currentField.type)}
                </p>
              </div>
              {field.deprecated && (
                <Badge variant="outline" className="text-muted-foreground">
                  Deprecated
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isNew && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Type locked</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={onDuplicate}>
                Duplicate
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => isNew ? onDelete() : setConfirmDelete(true)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`field-${field.id}-label`}>Field Label</Label>
                <Input
                  id={`field-${field.id}-label`}
                  value={currentField.label}
                  onChange={(e) => handleChange("label", e.target.value)}
                  placeholder="Enter field label"
                />
              </div>
              
              <div>
                <Label htmlFor={`field-${field.id}-type`}>Field Type</Label>
                <Select
                  value={currentField.type}
                  onValueChange={(value) => handleChange("type", value)}
                  disabled={!isNew} // Prevent changing type for existing fields
                >
                  <SelectTrigger id={`field-${field.id}-type`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isNew && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Field type cannot be changed after creation to preserve data integrity.
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor={`field-${field.id}-placeholder`}>Placeholder Text</Label>
              <Input
                id={`field-${field.id}-placeholder`}
                value={currentField.placeholder || ""}
                onChange={(e) => handleChange("placeholder", e.target.value)}
                placeholder="Enter placeholder text"
              />
            </div>
            
            <div>
              <Label htmlFor={`field-${field.id}-helpText`}>Help Text</Label>
              <Textarea
                id={`field-${field.id}-helpText`}
                value={currentField.helpText || ""}
                onChange={(e) => handleChange("helpText", e.target.value)}
                placeholder="Enter help text shown to users"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id={`field-${field.id}-required`}
                checked={currentField.required}
                onCheckedChange={(checked) => handleChange("required", checked)}
              />
              <Label htmlFor={`field-${field.id}-required`}>Required Field</Label>
            </div>
            
            {/* Additional field-specific options based on type */}
            {(currentField.type === "select" || currentField.type === "multiselect" || currentField.type === "radio") && (
              <FieldOptions 
                options={currentField.options || []} 
                onChange={(options) => handleChange("options", options)}
                isExisting={!isNew}
              />
            )}
            
            {/* Additional validation options based on field type */}
            {currentField.type === "number" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`field-${field.id}-min`}>Minimum Value</Label>
                  <Input
                    id={`field-${field.id}-min`}
                    type="number"
                    value={currentField.validation?.find(v => v.type === 'min')?.value || ""}
                    onChange={(e) => {
                      const min = parseFloat(e.target.value)
                      const validation = currentField.validation || []
                      const minIndex = validation.findIndex(v => v.type === 'min')
                      
                      if (e.target.value === "") {
                        // Remove validation if empty
                        if (minIndex >= 0) {
                          validation.splice(minIndex, 1)
                        }
                      } else {
                        // Add or update validation
                        const rule = { type: 'min' as const, value: min, message: `Value must be at least ${min}` }
                        if (minIndex >= 0) {
                          validation[minIndex] = rule
                        } else {
                          validation.push(rule)
                        }
                      }
                      
                      handleChange("validation", validation)
                    }}
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <Label htmlFor={`field-${field.id}-max`}>Maximum Value</Label>
                  <Input
                    id={`field-${field.id}-max`}
                    type="number"
                    value={currentField.validation?.find(v => v.type === 'max')?.value || ""}
                    onChange={(e) => {
                      const max = parseFloat(e.target.value)
                      const validation = currentField.validation || []
                      const maxIndex = validation.findIndex(v => v.type === 'max')
                      
                      if (e.target.value === "") {
                        // Remove validation if empty
                        if (maxIndex >= 0) {
                          validation.splice(maxIndex, 1)
                        }
                      } else {
                        // Add or update validation
                        const rule = { type: 'max' as const, value: max, message: `Value must be at most ${max}` }
                        if (maxIndex >= 0) {
                          validation[maxIndex] = rule
                        } else {
                          validation.push(rule)
                        }
                      }
                      
                      handleChange("validation", validation)
                    }}
                    placeholder="No maximum"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Confirmation dialog for deleting existing fields */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p>Deleting an existing field may impact:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Historical data associated with this field</li>
                  <li>Reports and analytics that use this field</li>
                  <li>Automations or workflows that depend on this field</li>
                </ul>
                <div className="flex items-center gap-2 mt-4 p-2 bg-amber-50 border border-amber-200 rounded">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <p className="text-sm text-amber-700">
                    Consider deprecating this field instead of deleting it to preserve data integrity.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                handleChange("deprecated", true)
                setConfirmDelete(false)
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Deprecate Field
            </AlertDialogAction>
            <AlertDialogAction 
              onClick={() => {
                onDelete()
                setConfirmDelete(false)
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Component for managing select/radio/checkbox options
interface FieldOptionsProps {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
  isExisting: boolean;
}

function FieldOptions({ options, onChange, isExisting }: FieldOptionsProps) {
  const [currentOptions, setCurrentOptions] = useState(options)
  
  const addOption = () => {
    const newOption = { 
      label: "", 
      value: `option_${Date.now()}` // Generate unique value
    }
    const updatedOptions = [...currentOptions, newOption]
    setCurrentOptions(updatedOptions)
    onChange(updatedOptions)
  }
  
  const updateOption = (index: number, key: string, value: string) => {
    const updatedOptions = [...currentOptions]
    updatedOptions[index] = { ...updatedOptions[index], [key]: value }
    setCurrentOptions(updatedOptions)
    onChange(updatedOptions)
  }
  
  const removeOption = (index: number) => {
    // For existing fields, we prevent removing options that might have data
    if (isExisting) {
      const updatedOptions = [...currentOptions]
      // Mark as deprecated if this is an existing field
      updatedOptions[index] = { 
        ...updatedOptions[index], 
        deprecated: true 
      }
      
      // Filter out deprecated options for display purposes, but keep them in data
      setCurrentOptions(updatedOptions.filter(opt => !opt.deprecated))
      onChange(updatedOptions)
    } else {
      // For new fields, we can remove freely
      const updatedOptions = [...currentOptions]
      updatedOptions.splice(index, 1)
      setCurrentOptions(updatedOptions)
      onChange(updatedOptions)
    }
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <Label>Options</Label>
        <Button variant="outline" size="sm" onClick={addOption}>
          Add Option
        </Button>
      </div>
      
      {currentOptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No options added yet</p>
      ) : (
        <div className="space-y-2 mb-2">
          {currentOptions.map((option, index) => (
            <div key={option.value} className="flex items-center gap-2">
              <Input
                value={option.label}
                onChange={(e) => updateOption(index, "label", e.target.value)}
                placeholder="Option label"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeOption(index)}
                disabled={isExisting && currentOptions.length <= 1}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {isExisting && (
        <p className="text-xs text-muted-foreground mt-1">
          You can add new options, but removing options will only hide them from new submissions.
        </p>
      )}
    </div>
  )
} 