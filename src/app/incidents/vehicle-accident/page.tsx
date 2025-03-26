"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Clock, Car } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  date: z.date({
    required_error: "Date is required",
  }),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(3, "Location is required"),
  jobNumber: z.string().min(1, "Job number is required"),
  supervisor: z.string().min(1, "Supervisor is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  driverName: z.string().min(3, "Driver name is required"),
  vehicleMakeModel: z.string().min(3, "Vehicle make/model is required"),
  vin: z.string().optional(),
  damageDescription: z.string().min(10, "Damage description must be at least 10 characters"),
  thirdPartyInvolved: z.boolean().default(false),
  policeReportFiled: z.boolean().default(false),
  policeReportNumber: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function VehicleAccidentPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "HH:mm"),
      location: "",
      jobNumber: "",
      supervisor: "",
      city: "",
      state: "",
      description: "",
      driverName: "",
      vehicleMakeModel: "",
      vin: "",
      damageDescription: "",
      thirdPartyInvolved: false,
      policeReportFiled: false,
      policeReportNumber: "",
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    // In a real app, this would submit to Firebase
    console.log("Form data:", data)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // Show success message or redirect
      alert("Vehicle accident report submitted successfully!")
      form.reset()
    }, 1500)
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-3xl p-4 pb-20 md:p-8 md:pb-8">
        <Card>
          <CardHeader className="bg-blue-800 text-white">
            <CardTitle className="flex items-center justify-center text-2xl">
              <Car className="mr-2 h-6 w-6" />
              Vehicle Accident Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-md bg-blue-50 p-4">
                  <h3 className="mb-4 text-center text-lg font-semibold text-blue-800">GENERAL INFORMATION</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground",
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <div className="flex items-center">
                            <FormControl>
                              <Input type="time" {...field} className="w-full" />
                            </FormControl>
                            <Clock className="ml-2 h-4 w-4 text-muted-foreground" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location of Accident</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter the location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="jobNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Number</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select job number" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="JOB-001">JOB-001</SelectItem>
                              <SelectItem value="JOB-002">JOB-002</SelectItem>
                              <SelectItem value="JOB-003">JOB-003</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supervisor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select your Supervisor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select supervisor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="John Smith">John Smith</SelectItem>
                              <SelectItem value="Jane Doe">Jane Doe</SelectItem>
                              <SelectItem value="Robert Johnson">Robert Johnson</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Jacksonville">Jacksonville</SelectItem>
                                <SelectItem value="Orlando">Orlando</SelectItem>
                                <SelectItem value="Tampa">Tampa</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="FL">Florida</SelectItem>
                                <SelectItem value="GA">Georgia</SelectItem>
                                <SelectItem value="SC">South Carolina</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description of Accident or Loss</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Provide a detailed description of what happened"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 p-4">
                  <h3 className="mb-4 text-center text-lg font-semibold text-blue-800">
                    PROPERTY DAMAGE (VEHICLES, EQUIPMENT AND BUILDINGS)
                  </h3>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="driverName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Insured Driver Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter driver's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleMakeModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vehicle/Equipment Make/Model</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Ford F-150 2020" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>VIN #</FormLabel>
                          <FormControl>
                            <Input placeholder="Vehicle Identification Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="damageDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Damage Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the damage to the vehicle/equipment"
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" type="button" onClick={() => form.reset()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}

