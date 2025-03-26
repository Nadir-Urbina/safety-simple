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
import { CalendarIcon } from "lucide-react"

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
          if (field.validation?.min !== undefined) {
            fieldSchema = fieldSchema.min(field.validation.min)
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = fieldSchema.max(field.validation.max)
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
    // File upload would require more complex handling
    case 'file':
      return (
        <UIFormField
          control={form.control}
          name={field.id}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
              <FormControl>
                <Input 
                  type="file" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    formField.onChange(file)
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
    default:
      return null
  }
} 