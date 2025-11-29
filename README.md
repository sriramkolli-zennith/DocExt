# DocExtract

A premium document extraction platform powered by AI. Upload documents, extract structured data automatically, and validate results with an intuitive interface.

![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### Document Management
- **Upload & Process** - Drag-and-drop PDF and image upload with automatic processing
- **Smart Extraction** - AI-powered field extraction using Azure Document Intelligence
- **Duplicate Detection** - Automatic detection of duplicate documents via file hash

### Field Extraction & Validation
- **Custom Fields** - Define custom fields (text, number, date, currency, etc.) to extract
- **Confidence Scores** - View extraction confidence with visual indicators
- **Alternative Values** - See top 4 alternative extractions ranked by confidence
- **Manual Validation** - Thumbs up/down feedback with 2-attempt limit per field
- **Re-extraction** - Edit field name/type and trigger single-field re-extraction

### PDF Viewer
- **Split View** - Side-by-side document and extracted data view
- **Field Highlighting** - Click any field to highlight its location in the PDF
- **Label + Value Boxes** - Visual bounding boxes for both labels and values
- **Auto-scroll** - Automatic page navigation to highlighted fields

### User Experience
- **Dark Mode** - Full dark/light theme support
- **Responsive Design** - Mobile-first design, works on all devices
- **Real-time Updates** - Instant UI updates with optimistic rendering
- **Session Management** - Activity-based session timeout with warning modal

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **UI Components** | Shadcn UI, Lucide Icons |
| **Backend** | Supabase Edge Functions (Deno) |
| **Database** | PostgreSQL with Row-Level Security |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth (Email, Google, GitHub) |
| **AI** | Azure Document Intelligence |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Azure account (for Document Intelligence)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sriramkolli-zennith/DocExt.git
   cd DocExt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Azure Document Intelligence (for Edge Functions)
   AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=your_azure_endpoint
   AZURE_DOCUMENT_INTELLIGENCE_KEY=your_azure_key
   ```

4. **Set up the database**
   
   Run `DATABASE_SETUP.sql` in your Supabase SQL Editor. This creates:
   - All required tables (profiles, documents, document_fields, extracted_data, field_recommendations)
   - Row-level security policies
   - Triggers and functions
   - Storage bucket with policies

5. **Deploy Edge Functions**
   ```bash
   # Deploy all functions
   npx supabase functions deploy process-document-backend --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy get-extracted-data-backend --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy upload-document-backend --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy update-field-feedback --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy re-extract-single-field --project-ref YOUR_PROJECT_REF
   ```

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
DocExt/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── documents/         # Document list & detail pages
│   ├── extract/           # New extraction page
│   ├── account/           # User profile
│   ├── privacy/           # Privacy policy
│   ├── terms/             # Terms of service
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── ...               # Feature components
├── lib/                   # Utilities & Supabase clients
├── supabase/
│   └── functions/        # Edge Functions
│       ├── process-document-backend/
│       ├── get-extracted-data-backend/
│       ├── upload-document-backend/
│       ├── update-field-feedback/
│       └── re-extract-single-field/
└── DATABASE_SETUP.sql    # Complete database schema
```

## 📊 Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (auto-created on signup) |
| `documents` | Uploaded documents with status tracking |
| `document_fields` | Field definitions for each document |
| `extracted_data` | Extracted values with confidence scores |
| `field_recommendations` | AI recommendations for failed extractions |

### Key Features

- **Row-Level Security** - Users can only access their own data
- **Duplicate Prevention** - Unique index on user_id + file_hash
- **Automatic Timestamps** - created_at and processed_at auto-managed
- **Feedback Tracking** - User feedback stored with attempt limits

## 🔐 Authentication

Supports multiple authentication methods:

- **Email/Password** - Standard email signup with confirmation
- **Google OAuth** - One-click Google sign-in
- **GitHub OAuth** - One-click GitHub sign-in
- **Password Reset** - Secure password recovery flow

## 🎨 Design System

Premium SaaS design with:

- **Colors**: Indigo/Violet gradient primary, Slate neutrals
- **Cards**: Rounded-2xl with subtle shadows
- **Buttons**: Gradient primary, outline secondary
- **Dark Mode**: Full support with proper contrast ratios
- **Typography**: Clean, readable with proper hierarchy

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with features |
| Login | `/auth/login` | User authentication |
| Sign Up | `/auth/sign-up` | New user registration |
| Dashboard | `/dashboard` | Document overview & stats |
| Documents | `/documents` | Document list with filters |
| Document Detail | `/documents/[id]` | Extraction results & PDF viewer |
| Extract | `/extract` | Upload new documents |
| Profile | `/account/profile` | User settings |
| Privacy | `/privacy` | Privacy policy |
| Terms | `/terms` | Terms of service |

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

Built with ❤️ by [Zennith AI](https://github.com/sriramkolli-zennith)