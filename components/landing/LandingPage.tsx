"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronDown, Check, ArrowRight, AlertTriangle, Thermometer, ThumbsUp, Shield, Users, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function LandingPage() {
  const { toast } = useToast()
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: ""
  })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // In a real app, this would send the contact form data to a backend
    console.log("Contact form submitted:", contactForm)
    
    toast({
      title: "Thanks for reaching out!",
      description: "We'll get back to you within 24 hours.",
    })
    
    setContactForm({
      name: "",
      email: "",
      company: "",
      message: ""
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 border-b bg-background">
        <nav className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Safety-Simple</span>
          </div>
          <div className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium hover:underline">Features</Link>
            <Link href="#pricing" className="text-sm font-medium hover:underline">Pricing</Link>
            <Link href="#testimonials" className="text-sm font-medium hover:underline">Testimonials</Link>
            <Link href="#faq" className="text-sm font-medium hover:underline">FAQ</Link>
            <Link href="#contact" className="text-sm font-medium hover:underline">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-foreground via-background to-muted z-0"></div>
          <div className="container relative z-10 px-4 md:px-6">
            <div className="grid gap-12 md:grid-cols-2 md:gap-16">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Simplify Safety Management in Construction</h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    A complete solution for environmental, health, and safety management designed specifically for construction companies.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/signup">
                    <Button size="lg" className="gap-1">
                      Get Started <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="#contact">
                    <Button size="lg" variant="outline">
                      Request Demo
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Trusted by 50+ construction companies nationwide</span>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-[350px] sm:h-[400px] sm:w-[400px] md:h-[450px] md:w-[450px]">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-primary-foreground opacity-20 blur-3xl"></div>
                  <div className="relative flex h-full w-full items-center justify-center rounded-xl bg-muted p-4 shadow-lg">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="p-3">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <h3 className="text-sm font-medium">Incident Reporting</h3>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-3">
                          <Thermometer className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <h3 className="text-sm font-medium">Heat Prevention</h3>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-3">
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <h3 className="text-sm font-medium">Recognition</h3>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="p-3">
                          <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                          <h3 className="text-sm font-medium">Admin Tools</h3>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Comprehensive Safety Features</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Our platform provides all the tools you need for effective safety management
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 pt-12 md:grid-cols-3">
              <Card className="flex flex-col">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Incident Reporting</CardTitle>
                  <CardDescription>
                    Comprehensive incident reporting for injuries, vehicle accidents, and environmental spills
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Injury & Illness Reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Vehicle Accident Tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Environmental Spill Management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Photo Documentation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <Thermometer className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Heat Illness Prevention</CardTitle>
                  <CardDescription>
                    Track weather conditions and implement heat safety protocols
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Real-time Heat Index Monitoring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Automated Safety Alerts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Heat JSA Form Submission</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Precaution Documentation</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <ThumbsUp className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Employee Recognition</CardTitle>
                  <CardDescription>
                    Promote positive safety culture through recognition
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Hazard Recognition</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Near Miss Reporting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Job Safety Observations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Good Catch Recognition</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="mx-auto grid max-w-5xl gap-8 pt-12 md:grid-cols-2">
              <Card className="flex flex-col">
                <CardHeader>
                  <Users className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Admin Dashboard</CardTitle>
                  <CardDescription>
                    Powerful tools for EHS personnel to analyze and report on safety data
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Data Visualization & Trends</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Custom Report Generation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>User Management</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Data Export Capabilities</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <Award className="h-8 w-8 text-primary" />
                  <CardTitle className="mt-4">Multi-Device Support</CardTitle>
                  <CardDescription>
                    Seamless experience across all devices with offline capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Responsive Mobile Design</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Tablet-Optimized Interface</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Desktop Admin Dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Progressive Web App (PWA)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Transparent Pricing Plans</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Choose the plan that fits your organization's size and needs
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 pt-12 md:grid-cols-3">
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$499</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>For small teams up to 25 employees</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>All safety modules included</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Up to 25 user accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Basic admin dashboard</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Standard support</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>
              <Card className="flex flex-col border-primary">
                <CardHeader>
                  <div className="mb-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground w-fit">
                    POPULAR
                  </div>
                  <CardTitle>Professional</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">$999</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <CardDescription>For growing companies up to 100 employees</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>All Starter features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Up to 100 user accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Advanced analytics & reporting</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Data export capabilities</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Get Started</Button>
                </CardFooter>
              </Card>
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">Custom</span>
                  </div>
                  <CardDescription>For large organizations with custom needs</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="grid gap-2">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>All Professional features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Unlimited user accounts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Custom integrations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Dedicated account manager</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>24/7 priority support</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Custom branding options</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="bg-muted py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Trusted by Industry Leaders</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  See what our clients say about Safety-Simple
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 pt-12 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                      <span className="text-lg font-bold text-primary-foreground">JC</span>
                    </div>
                    <div>
                      <p className="font-medium">John Carter</p>
                      <p className="text-sm text-muted-foreground">EHS Director, ABC Construction</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-muted-foreground">
                      "Safety-Simple has revolutionized our incident reporting process. What used to take days now takes minutes, and our safety metrics have improved significantly."
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                      <span className="text-lg font-bold text-primary-foreground">SM</span>
                    </div>
                    <div>
                      <p className="font-medium">Sarah Martinez</p>
                      <p className="text-sm text-muted-foreground">Safety Manager, XYZ Buildings</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-muted-foreground">
                      "The heat illness prevention module has been a game-changer for our summer projects. Our workers feel safer, and we can demonstrate compliance with regulations."
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                      <span className="text-lg font-bold text-primary-foreground">RT</span>
                    </div>
                    <div>
                      <p className="font-medium">Robert Thompson</p>
                      <p className="text-sm text-muted-foreground">CEO, Thompson Construction</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-muted-foreground">
                      "The ROI on Safety-Simple was evident within months. Fewer incidents, better reporting, and a more engaged workforce have made this an essential tool."
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2 lg:col-span-3">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="space-y-2">
                      <p className="text-xl font-medium">
                        "Since implementing Safety-Simple, we've seen a 43% reduction in recordable incidents and a 67% improvement in near-miss reporting. The platform has transformed our safety culture."
                      </p>
                      <div className="flex items-center justify-center gap-4 pt-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                          <span className="text-xl font-bold text-primary-foreground">MM</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Michael Martinez</p>
                          <p className="text-sm text-muted-foreground">VP of Operations, Global Construction Inc.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Frequently Asked Questions</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Find answers to common questions about Safety-Simple
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl pt-12">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How long does it take to implement Safety-Simple?</AccordionTrigger>
                  <AccordionContent>
                    Most companies are up and running with Safety-Simple in less than a week. Our onboarding process includes account setup, user training, and customization to match your organization's needs. For larger enterprises, we offer additional implementation support.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Can Safety-Simple be used offline in the field?</AccordionTrigger>
                  <AccordionContent>
                    Yes, Safety-Simple is built as a Progressive Web App (PWA) that works offline. Users can fill out forms and submit reports even without internet connection. Data will sync automatically when connectivity is restored.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>How is data security handled?</AccordionTrigger>
                  <AccordionContent>
                    Safety-Simple uses enterprise-grade security measures including end-to-end encryption, secure authentication, and regular security audits. All data is stored in compliance with industry standards and regulations.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>Can we import our existing safety data?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely. We provide data migration services to import your historical safety data into Safety-Simple. Our team will work with you to ensure a smooth transition from your current systems.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Does Safety-Simple integrate with other software?</AccordionTrigger>
                  <AccordionContent>
                    Safety-Simple offers integrations with popular construction management software, HR systems, and data visualization tools. Custom integrations are available for Enterprise customers.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>How is user training provided?</AccordionTrigger>
                  <AccordionContent>
                    We provide comprehensive training resources including live webinars, on-demand video tutorials, and detailed documentation. Enterprise customers receive personalized training sessions for their teams.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-muted py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Get In Touch</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Have questions? Reach out to our team for a personalized demo
                </p>
              </div>
            </div>
            <div className="mx-auto max-w-3xl pt-12">
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleContactSubmit} className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        value={contactForm.name}
                        onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={contactForm.email}
                        onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="company">Company</Label>
                      <Input 
                        id="company" 
                        value={contactForm.company}
                        onChange={(e) => setContactForm({...contactForm, company: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea 
                        id="message" 
                        rows={4} 
                        value={contactForm.message}
                        onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                        required 
                      />
                    </div>
                    <Button type="submit" size="lg">
                      Request Demo
                    </Button>
                    <p className="text-center text-sm text-muted-foreground">
                      We'll get back to you within 24 hours.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Simplify Safety Management?</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Join the growing number of construction companies transforming their safety programs
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-6">
                <Link href="/signup">
                  <Button size="lg" className="gap-1">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#contact">
                  <Button size="lg" variant="outline">
                    Request Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container px-4 py-12 md:px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">Safety-Simple</span>
              </div>
              <p className="text-sm text-muted-foreground">
                A complete solution for environmental, health, and safety management designed for construction companies.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link>
                </li>
                <li>
                  <Link href="#testimonials" className="text-muted-foreground hover:text-foreground">Testimonials</Link>
                </li>
                <li>
                  <Link href="#faq" className="text-muted-foreground hover:text-foreground">FAQ</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">About Us</Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">Careers</Link>
                </li>
                <li>
                  <Link href="#contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link>
                </li>
                <li>
                  <Link href="#" className="text-muted-foreground hover:text-foreground">Cookie Policy</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Safety-Simple. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 