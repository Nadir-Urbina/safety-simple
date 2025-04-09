"use client"

import { useState, useCallback } from "react"
import { FormTemplate, FormField, FormSubmission } from "@/types/forms"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField as UIFormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, UploadIcon, CameraIcon, X, FileIcon, UserIcon, AlertTriangle } from "lucide-react"
import { useOrganizationMembers } from "../../src/hooks/use-organization-members"
import { ComboBox } from "../ui/combobox"

interface FormRendererProps {
  formTemplate: FormTemplate;
  initialValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onSaveDraft?: (data: Record<string, any>) => void;
  isSubmitting?: boolean;
}

export function FormRenderer({ 
  formTemplate, 
  initialValues = {}, 
  onSubmit,
  onSaveDraft,
  isSubmitting = false
}: FormRendererProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues)
  
  // Dynamically build zod schema based on form fields
  const buildFormSchema = useCallback(() => {
    const schema: Record<string, any> = {}
    
    formTemplate.fields?.filter(field => !field.deprecated).forEach(field => {
      // Define validation rules based on field type and configuration
      let fieldSchema: any
      
      switch (field.type) {
        case 'text':
          fieldSchema = z.string()
          break
        case 'textarea':
          fieldSchema = z.string()
          break
        case 'number':
          fieldSchema = z.number().optional()
          if (field.validation && Array.isArray(field.validation)) {
            const minRule = field.validation.find(rule => rule.type === 'min');
            const maxRule = field.validation.find(rule => rule.type === 'max');
            
            if (minRule && minRule.value !== undefined) {
              fieldSchema = fieldSchema.min(Number(minRule.value));
            }
            
            if (maxRule && maxRule.value !== undefined) {
              fieldSchema = fieldSchema.max(Number(maxRule.value));
            }
          }
          break
        case 'date':
          fieldSchema = z.date().optional()
          break
        case 'select':
          fieldSchema = z.string()
          break
        case 'multiselect':
          fieldSchema = z.array(z.string())
          break
        case 'checkbox':
          fieldSchema = z.boolean()
          break
        case 'radio':
          fieldSchema = z.string()
          break
        case 'file':
          fieldSchema = z.any().optional()
          break
        case 'employeeList':
          fieldSchema = z.string()
          break
        default:
          fieldSchema = z.string()
      }
      
      // Apply required validation if needed
      if (field.required) {
        if (field.type === 'number') {
          fieldSchema = z.number({
            required_error: `${field.label} is required`,
          })
        } else if (field.type === 'date') {
          fieldSchema = z.date({
            required_error: `${field.label} is required`,
          })
        } else if (field.type === 'multiselect') {
          fieldSchema = z.array(z.string(), {
            required_error: `${field.label} is required`,
          }).min(1, `${field.label} is required`)
        } else if (field.type !== 'checkbox') {
          fieldSchema = fieldSchema.min(1, `${field.label} is required`)
        }
      } else if (field.type === 'text' || field.type === 'textarea') {
        fieldSchema = fieldSchema.optional()
      }
      
      schema[field.id] = fieldSchema
    })
    
    return z.object(schema)
  }, [formTemplate.fields])
  
  const formSchema = buildFormSchema()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })
  
  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data)
  }
  
  // Filter out deprecated fields
  const activeFields = formTemplate.fields?.filter(field => !field.deprecated) || []
  
  // Sort fields by order
  const sortedFields = [...activeFields].sort((a, b) => a.order - b.order)
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{formTemplate.name}</CardTitle>
        <CardDescription>{formTemplate.description}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6">
            {sortedFields.map((field) => (
              <div key={field.id} className="space-y-2">
                {renderFormField(field, form)}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between">
            {onSaveDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onSaveDraft(form.getValues())}
              >
                Save Draft
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}

function renderFormField(field: FormField, form: any) {
  switch (field.type) {
    case 'text':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={field.placeholder} 
                  {...formField} 
                />
              </FormControl>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'textarea':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={field.placeholder} 
                  rows={4}
                  {...formField} 
                />
              </FormControl>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'number':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={field.placeholder}
                  {...formField}
                  onChange={(e) => {
                    const value = e.target.value
                    formField.onChange(value === "" ? undefined : Number(value))
                  }}
                />
              </FormControl>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'date':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !formField.value && "text-muted-foreground"
                      )}
                    >
                      {formField.value ? (
                        format(formField.value, "PPP")
                      ) : (
                        <span>{field.placeholder || "Select a date"}</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formField.value}
                    onSelect={formField.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'select':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <Select 
                onValueChange={formField.onChange} 
                defaultValue={formField.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder || "Select an option"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.deprecated}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'checkbox':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-md">
              <FormControl>
                <Checkbox
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
                {field.helpText && (
                  <FormDescription>{field.helpText}</FormDescription>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'radio':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem className="space-y-3">
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={formField.onChange}
                  defaultValue={formField.value}
                  className="flex flex-col space-y-1"
                >
                  {field.options?.map((option) => (
                    <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value={option.value} disabled={option.deprecated} />
                      </FormControl>
                      <FormLabel className="font-normal">
                        {option.label}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'multiselect':
      // This would require a custom multiselect component
      // For simplicity, temporarily using checkboxes for multiselect
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <div className="grid gap-2 border rounded-md p-3">
                {field.options?.map((option) => (
                  <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={(formField.value || []).includes(option.value)}
                        onCheckedChange={(checked) => {
                          const values = new Set(formField.value || [])
                          if (checked) {
                            values.add(option.value)
                          } else {
                            values.delete(option.value)
                          }
                          formField.onChange(Array.from(values))
                        }}
                        disabled={option.deprecated}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">
                      {option.label}
                    </FormLabel>
                  </FormItem>
                ))}
              </div>
              {field.helpText && (
                <FormDescription>{field.helpText}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )
    // File upload field
    case 'file':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Trigger file input click
                          const fileInput = document.getElementById(`${field.id}-upload`) as HTMLInputElement;
                          if (fileInput) fileInput.click();
                        }}
                        className="h-9"
                      >
                        <UploadIcon className="mr-2 h-4 w-4" />
                        Choose File
                      </Button>
                      
                      {/* Add camera capture button for mobile devices */}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          // Trigger camera capture
                          const cameraInput = document.getElementById(`${field.id}-camera`) as HTMLInputElement;
                          if (cameraInput) cameraInput.click();
                        }}
                        className="h-9"
                      >
                        <CameraIcon className="mr-2 h-4 w-4" />
                        Take Photo
                      </Button>
                    </div>
                    
                    {/* Hidden file input for regular uploads */}
                    <Input
                      id={`${field.id}-upload`}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Create preview URL for the UI
                          const previewUrl = URL.createObjectURL(file);
                          formField.onChange({
                            file,
                            previewUrl,
                            type: file.type
                          });
                        }
                      }}
                    />
                    
                    {/* Hidden file input for camera capture */}
                    <Input
                      id={`${field.id}-camera`}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Create preview URL for the UI
                          const previewUrl = URL.createObjectURL(file);
                          formField.onChange({
                            file,
                            previewUrl,
                            type: file.type
                          });
                        }
                      }}
                    />
                    
                    {/* Show file preview */}
                    {formField.value && (
                      <div className="mt-2">
                        {formField.value.type?.startsWith('image/') ? (
                          <div className="relative">
                            <img 
                              src={formField.value.previewUrl} 
                              alt="Preview" 
                              className="h-32 w-auto rounded-md object-cover"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => {
                                // Clean up the object URL to avoid memory leaks
                                if (formField.value?.previewUrl) {
                                  URL.revokeObjectURL(formField.value.previewUrl);
                                }
                                formField.onChange(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 rounded-md border p-2">
                            <FileIcon className="h-4 w-4" />
                            <span className="text-sm truncate max-w-[200px]">
                              {formField.value.file?.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-auto h-6 w-6 rounded-full p-0"
                              onClick={() => {
                                // Clean up the object URL to avoid memory leaks
                                if (formField.value?.previewUrl) {
                                  URL.revokeObjectURL(formField.value.previewUrl);
                                }
                                formField.onChange(null);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {field.helpText && (
                    <FormDescription>{field.helpText}</FormDescription>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )
    case 'employeeList':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => {
            const { comboBoxItems, isLoading, error } = useOrganizationMembers();
            
            return (
              <FormItem>
                <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <div>
                    {isLoading ? (
                      <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md text-muted-foreground">
                        <span className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"></span>
                        Loading employees...
                      </div>
                    ) : error ? (
                      <div className="flex items-center gap-2 h-10 px-3 py-2 border border-destructive rounded-md text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {error}
                      </div>
                    ) : (
                      <ComboBox
                        items={comboBoxItems}
                        value={formField.value}
                        onValueChange={formField.onChange}
                        placeholder={field.placeholder || "Select an employee..."}
                        emptyText="No employees found."
                        className={formField.value ? "border-primary" : ""}
                      />
                    )}
                  </div>
                </FormControl>
                {formField.value && comboBoxItems.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-3 w-3" />
                    Selected: {comboBoxItems.find(item => item.value === formField.value)?.label || "Unknown employee"}
                  </div>
                )}
                {field.helpText && (
                  <FormDescription>{field.helpText}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            );
          }}
        />
      )
    default:
      return null
  }
} 