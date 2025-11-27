# DocExt - Document Extraction Platform

A Next.js application powered by Supabase Edge Functions and Azure Document Intelligence for intelligent document processing and field extraction.

## 🎯 Overview

DocExt is a full-stack document extraction platform that allows users to upload documents (PDFs, images) and automatically extract structured data using AI. Features include:

- **Document Management**: Upload, process, and manage documents
- **Intelligent Extraction**: Uses Azure Document Intelligence to extract fields
- **Split View PDF Viewer**: Side-by-side document and field details with field search
- **Field Highlighting**: Search and highlight extracted values in the PDF using Ctrl+F
- **Authentication**: Email and OAuth (Google/GitHub) support
- **Real-time Dashboard**: View all processed documents and extracted data
- **Secure Storage**: User-scoped document storage with RLS protection
- **Field Validation**: Edit and manually correct extracted values with live updates
- **Feedback Loop**: Capture thumbs-up/down responses, surface up to four AI-proposed alternatives, and learn from manual selections
- **Dark Mode Support**: Full dark mode support across all pages
- **Responsive Design**: Mobile-first responsive design on all devices

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS (Dark Mode), Shadcn UI |
| **Backend** | Supabase Edge Functions (Deno), PostgreSQL |
| **Storage** | Supabase Storage (PDF/Images) |
| **Auth** | Supabase Auth (Email, Google OAuth, GitHub OAuth) |
| **AI/ML** | Azure Document Intelligence (prebuilt-invoice model) |
| **Database** | PostgreSQL with Row-Level Security (RLS) |
| **PDF Viewer** | Native browser PDF viewer with search & highlighting |

## 📋 Database Schema

See `DATABASE_SETUP.sql` for complete schema. Key tables:

### Profiles
- Stores user profile information
- Auto-created on signup via trigger
- RLS: Users can only access their own profile

### Documents
- Stores uploaded documents metadata
- Status tracking: pending → processing → completed/failed
- Auto-updates processed_at timestamp when completed

### Document_Fields
- Defines which fields to extract from each document
- Flexible field types: text, number, date, email, phone, currency, boolean


## 🧠 Top Alternatives & Feedback

### Capabilities
- Stores up to four high-confidence matches (value + label bounding boxes) for every requested field
- Lets users approve or reject extractions, pick any alternative, and flag manual overrides
- Generates AI-powered recommendations for fields that failed extraction so your team can backfill data later

### Database Additions
- `extracted_data` includes `top3_*` arrays, `user_feedback`, `is_manually_selected`, `selected_from_top3_index`, and `feedback_timestamp`
- `document_fields` records capture both value and label bounding metadata for precise PDF highlighting
- `field_recommendations` keeps rank-ordered fallback suggestions per missing field
- `documents` enforces deduplication via the `file_hash` column/index to block duplicates

### Edge Functions
1. `process-document-backend` ranks Azure fields with `calculateMatchScore`, saves the best value plus three alternatives, and produces contextual recommendations
2. `get-extracted-data-backend` returns the enriched dataset (alternatives, bounding boxes, feedback flags)
3. `update-field-feedback` records thumbs-up/down actions, manual selections, and synchronizes the stored value

### Frontend Experience
- `app/documents/[id]/page.tsx` surfaces thumbs controls, a "manually selected" badge, and feeds label/value polygons to `PDFViewerSidebar`
- `FieldValidationModal` renders confidence bars, page metadata, and supports one-click alternative selection
- `PDFViewerSidebar` highlights values (amber) and labels (blue) with synchronized auto-close + auto-scroll behavior

### Deployment Checklist
1. **Apply `DATABASE_SETUP.sql`** in the Supabase SQL Editor (or via `supabase db push`) to provision tables, policies, triggers, indexes, and verification queries
2. **Deploy edge functions** with `npm run functions:deploy` (or the scoped scripts) so backend logic matches the schema
3. **Deploy/push the frontend** – run `npm run build && npm run start` locally or `git push origin main` to trigger CI/CD

### Monitoring & Verification
```sql
-- Verify extracted_data captures feedback + label metadata
SELECT id, top3_values, top3_label_page_numbers, user_feedback, is_manually_selected
FROM extracted_data ORDER BY created_at DESC LIMIT 5;

-- Inspect document_fields for stored label polygons
SELECT id, name, label_page_number, label_bounding_box IS NOT NULL AS has_label_box
FROM document_fields WHERE label_page_number IS NOT NULL LIMIT 5;

-- Review recommendation coverage
SELECT missing_field_name, COUNT(*) AS recommendations
FROM field_recommendations GROUP BY missing_field_name;
```

```bash
# Tail Supabase function logs (all functions)
### Extracted_Data

# Focus on the feedback function (requires linked project)
- Stores extracted values with confidence scores
```

### Rollback Notes
- Drop the `top3_*` and feedback columns plus the `field_recommendations` table, then redeploy the previous function builds to revert
- Always snapshot data or run changes in staging before executing destructive SQL

- Persists up to four alternative values, confidences, page/label bounding boxes, and user feedback metadata (thumbs, manual selection, timestamps)
- Unique constraint on (document_id, field_id) to prevent duplicates

### Field_Recommendations
- Tracks contextual suggestions for fields that failed extraction
- Stores recommended field metadata, page + bounding box info, and rank-ordered relevance scores
- Enables surfacing smart fallbacks in the UI or analytics

### Storage Buckets
- `documents` bucket: Stores PDFs and images
- User-scoped paths: `user_id/filename` format
- Public read for Azure Document Intelligence processing

## 📁 Project Structure

```
DocExt/
├── app/                                    # Next.js app directory
│   ├── page.tsx                           # Landing page
│   ├── layout.tsx                         # Root layout
│   ├── globals.css                        # Global styles
│   ├── auth/
│   │   ├── login/page.tsx                # Email + OAuth login
│   │   ├── sign-up/page.tsx              # Registration
│   │   ├── confirm/page.tsx              # Email confirmation
│   │   ├── sign-up-success/page.tsx      # Confirmation message
│   │   └── callback/route.ts             # OAuth redirect handler
│   ├── dashboard/page.tsx                 # User's documents list
│   ├── documents/
│   │   ├── page.tsx                       # Documents list with search
│   │   └── [id]/page.tsx                  # Document detail with split PDF view
│   ├── extract/page.tsx                   # Upload & configure extraction
│   ├── account/
│   │   └── profile/page.tsx               # User profile settings
│
├── components/
│   ├── navbar.tsx                         # Navigation bar with dark mode toggle
│   ├── document-card.tsx                  # Document card with dark mode
│   ├── field-validation-modal.tsx         # Field editing modal
│   ├── pdf-viewer-sidebar.tsx             # Split view PDF viewer with search hint
│   ├── session-warning-modal.tsx          # Session timeout warning
│   ├── theme-provider.tsx                 # Dark mode provider
│   ├── theme-toggle.tsx                   # Dark mode toggle button
│   └── ui/                                # Shadcn UI components library
│
├── lib/
│   ├── client.ts                          # Supabase client (browser)
│   ├── server.ts                          # Supabase client (server)
│   ├── edge-functions.ts                  # Edge function API helpers
│   └── utils.ts                           # Utility functions
│
├── supabase/
│   ├── config.toml                        # Supabase local config
│   ├── functions/
│   │   ├── upload-document-backend/
│   │   │   └── index.ts                   # Generate signed upload URLs
│   │   ├── process-document-backend/
│   │   │   └── index.ts                   # Call Azure AI & save results
│   │   ├── get-extracted-data-backend/
│   │   │   └── index.ts                   # Retrieve extracted data
│   │   └── _shared/
│   │       └── cors.ts                    # CORS header utilities
│   └── DEPLOYMENT.md                      # Edge function deployment guide
│
├── public/                                 # Static assets
├── scripts/
│   └── 002_create_storage_bucket.sql      # Storage bucket setup (reference)
│
├── middleware.ts                           # Auth middleware for protected routes
├── DATABASE_SETUP.sql                      # Complete database schema & setup
├── README.md                               # This file
├── package.json                            # Dependencies & scripts
├── tsconfig.json                           # TypeScript config
├── next.config.ts                          # Next.js config
├── tailwind.config.mjs                     # Tailwind CSS config
├── postcss.config.mjs                      # PostCSS config
├── eslint.config.mjs                       # ESLint config
└── components.json                         # Shadcn UI config
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (https://supabase.com)
- Azure Document Intelligence resource
- Supabase CLI: `npm install -g supabase`

### 1. Clone & Install

```bash
git clone <repo-url>
cd DocExt
npm install
```

### 2. Setup Supabase

```bash
# Login to Supabase
npm run supabase:login

# Link to your project
npm run supabase:link --project-ref <your-project-ref>
```

### 3. Setup Database

Run the SQL setup in Supabase SQL Editor:

1. Go to Supabase Dashboard → Project → SQL Editor
2. Copy contents of `DATABASE_SETUP.sql`
3. Paste and run in SQL Editor
4. Verify tables were created

```bash
# Alternatively, use Supabase CLI
supabase db push
```

### 4. Configure Secrets

Set Edge Function secrets in Supabase:

```bash
supabase secrets set \
  AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-region.cognitiveservices.azure.com/ \
  AZURE_DOCUMENT_INTELLIGENCE_API_KEY=your_api_key \
  AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice \
  GEMINI_API_KEY=your_gemini_key
```

### 5. Environment Variables

Create `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Development (optional)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/dashboard
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Available Commands

### Development
```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Check code quality with ESLint
```

### Supabase
```bash
npm run supabase:login   # Login to Supabase CLI
npm run supabase:link    # Link to Supabase project
npm run supabase:start   # Start local Supabase instance
npm run supabase:stop    # Stop local Supabase instance
```

### Edge Functions
```bash
npm run functions:serve      # Serve functions locally
npm run functions:deploy     # Deploy all functions to production
npm run functions:deploy:upload    # Deploy only upload function
npm run functions:deploy:process   # Deploy only process function
npm run functions:deploy:data      # Deploy only data retrieval function
npm run functions:logs       # View function logs
```

### Secrets
```bash
npm run secrets:set          # Set Edge Function secrets
```

## 🔐 Security

### Authentication
- Email/password authentication via Supabase Auth
- OAuth providers: Google, GitHub
- JWT tokens for API requests
- Session management via Supabase

### Database Security
- Row-Level Security (RLS) enabled on all tables
- Users can only access their own documents
- Policies prevent cross-user data access
- Automatic cascading deletes

### Storage Security
- User-scoped paths: `{user_id}/{filename}`
- Private by default, public only for Azure processing
- Signed URLs for uploads (5-minute expiry)
- Middleware protects routes

### API Security
- Edge functions verify JWT tokens
- CORS headers configured
- Secrets stored securely (not in code)
- No sensitive data in client code

## 🔄 Data Flow

```
User Upload
    ↓
Frontend validates file
    ↓
Edge Function: upload-document-backend
    ├─ Generates signed upload URL
    ├─ Returns path & public URL
    └─ Frontend uploads file
    ↓
Frontend calls: process-document-backend
    ├─ Creates document record (status: processing)
    ├─ Creates field definitions
    ├─ Calls Azure Document Intelligence API
    ├─ Polls for results (max 60 seconds)
    ├─ Saves extracted data with confidence scores
    └─ Updates document status: completed
    ↓
Frontend redirects to dashboard
    ↓
User clicks on document
    ↓
Edge Function: get-extracted-data-backend
    ├─ Retrieves document
    ├─ Retrieves extracted fields
    └─ Returns formatted data
    ↓
Frontend displays document details
    └─ User can edit/validate field values
```

## 📊 Database Triggers

### handle_new_user()
- **Trigger**: `on_auth_user_created`
- **When**: New user signs up
- **Action**: Auto-creates profile record with username, full_name, avatar_url

### update_document_processed_at()
- **Trigger**: `document_processed_at_trigger`
- **When**: Document status changes to "completed"
- **Action**: Auto-sets processed_at timestamp

## 🌐 API Endpoints

### Edge Functions
- `POST /functions/v1/upload-document-backend` - Generate upload URL
- `POST /functions/v1/process-document-backend` - Process document
- `POST /functions/v1/get-extracted-data-backend` - Get extracted data

## ✨ UI/UX Features

### Dark Mode
- Complete dark mode support across all pages
- Toggle button in navbar for easy switching
- Consistent color scheme using Tailwind dark utilities
- Better readability and reduced eye strain

### Responsive Design
- Mobile-first approach with breakpoints: `sm:`, `lg:`
- Optimized layouts for phone, tablet, and desktop
- Touch-friendly buttons and interactions
- Flexible grid layouts

### Split View PDF Viewer
- **50% screen width on desktop** for side-by-side comparison
- Header with field name, value, and close button
- Real-time confidence score display
- Field information footer with search hint
- Smooth transitions and animations

### Field Search & Highlighting
- Use **Ctrl+F** (or Cmd+F) to search in PDF
- Native PDF viewer search functionality
- Extracted value highlighted in yellow in the info panel
- Quick search tip in the footer

### Field Validation & Editing
- Click "Edit" button on any field to open validation modal
- Edit field values with side-by-side document preview
- Confidence score visualization
- Save changes to database with error handling

## 📝 Environment Setup

### Local Development
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Production
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy the .next folder to Vercel/Netlify
```

### Edge Functions (Supabase)
```bash
npm run functions:deploy
```

### Database
```bash
# Migrations are auto-applied via Supabase
supabase db push
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify Supabase project is running
- Check `NEXT_PUBLIC_SUPABASE_URL` and anon key
- Run `npm run supabase:link` to link project

### Edge Function Errors
- Check logs: `npm run functions:logs`
- Verify secrets are set: `supabase secrets list`
- Test locally: `npm run functions:serve`

### Document Upload Issues
- Check file size (max 50MB)
- Verify storage bucket exists
- Check RLS policies on storage

### Azure Intelligence Errors
- Verify endpoint URL format
- Check API key is valid
- Confirm model ID is correct (prebuilt-invoice)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Azure Document Intelligence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)

## 📄 License

Private and Proprietary

## 👥 Support

For issues, questions, or contributions, contact the development team.


