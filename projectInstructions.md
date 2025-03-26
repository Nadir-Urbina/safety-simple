You are building a web application, that needs to be fully responsive as it will be used in phones, computers and tablets.

The app is called safety-simple, and this is a complete solution for companies to manage environmental, health and safety related topics.

The focus of the app is to create employee engagement, and it has two main components, the end user interface, and an admin interface.

The user interface is a combination of 3 programs, incident reporting, heat illness prevention, and employee recognition.

In the incident reporting section we have the followign incident types:
- Injury and Illness
- Vehicle Accident
- Environmental Spill/Release

The heat illness prevention program is a place where employees can check the weather status, and particularly pay attention to the Heat Index, and submit a report based on the precautions they are taking depending on the Predicted Max Heat Index.

Finally the employee recognition section has the following forms:
Hazard Recognition
Near Miss
Job Safety Observation
Good Catch

The second component of this application is the admin interface, where EHS Personnel will be able to see reports, trends, analysis and so on, export data, and send reports to other interested parties.

The UI of this app needs to be both user friendly and modern, and again responsive.

I am adding some screenshots of the current app which runs on Microsoft Power Apps just as a visual representation of fields that are part of the solution as it is now.

and finally here are some guidelines for this project:

# Project Instructions

## Tech Stack
You are an expert in Web Development using:
- TypeScript
- Node.js
- React
- Next.js (App Router)
- Tailwind CSS
- ShadCN UI
- Firebase (Auth, Firestore, Storage)
- Sanity CMS

## Code Style and Structure
* Write concise, technical TypeScript code with proper type annotations
* Use functional and declarative programming patterns; avoid classes
* Prefer immutability and pure functions when possible
* Use iteration and modularization over code duplication
* Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError)
* Structure files: exported component, subcomponents, helpers, static content
* Always use proper TypeScript interfaces or types for data models

## Naming Conventions
* Use kebab-case for directories
* Use camelCase for variables and functions
* Use PascalCase for components and type definitions
* File names for components should be in PascalCase. Rest of the files in kebab-case
* Prefix component names with their type (e.g., ButtonAccount.tsx, CardAnalyticsMain.tsx)
* Use descriptive type names with suffixes like Props, Data, Response

## Syntax and Formatting
* Use the "function" keyword for pure functions
* Use arrow functions for callbacks and component definitions
* Use TypeScript's type inference where appropriate, but add explicit types for function parameters and returns
* Avoid unnecessary curly braces in conditionals; use concise syntax for simple statements
* Use optional chaining (?.) and nullish coalescing (??) operators

## UI and Styling
* Use ShadCN UI components as the foundation
* Extend with Tailwind CSS for custom styling needs
* Implement responsive design with Tailwind CSS; use a mobile-first approach
* Leverage Tailwind's composable classes rather than creating custom CSS
* Use color tokens from the theme consistently

## State Management and Data Flow
* Use Firebase for authentication and data storage
* Implement proper typed Firebase hooks for data fetching and mutations
* Create typed API for Firebase interactions
* Use Sanity for content management with typed schemas
* Implement GROQ queries with proper TypeScript types

## Performance Optimization
* Minimize 'use client', 'useState', and 'useEffect'; favor React Server Components (RSC)
* Wrap client components in Suspense with fallback
* Use dynamic loading for non-critical components
* Optimize images: use Next.js Image component with proper sizing
* Implement proper Firebase query optimizations (limit, where clauses)
* Add proper Firebase indexing for complex queries

## Key Conventions
* Optimize Web Vitals (LCP, CLS, FID)
* Limit 'use client':
  * Favor server components and Next.js SSR
  * Use only for Web API access, Firebase SDK in small components
  * Use proper data fetching patterns for Firebase in server components
* Follow TypeScript best practices:
  * Create interfaces for all data models
  * Use utility types (Partial, Pick, Omit) appropriately
  * Define proper return types for all functions
* Firebase conventions:
  * Create typed hooks for Firestore operations
  * Always handle loading and error states
  * Implement proper security rules
* Sanity conventions:
  * Create typed schemas
  * Use properly typed GROQ queries
  * Implement content validation

## Design Guidelines
* Create beautiful, production-worthy designs, not cookie-cutter templates
* Use ShadCN UI components as building blocks, customize as needed
* Maintain consistent spacing, typography, and color usage
* Ensure accessibility standards are met
* Do not install additional UI packages unless absolutely necessary