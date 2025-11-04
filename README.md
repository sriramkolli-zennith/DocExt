# DocExt UpperModel - Document Extraction Platform

A Next.js application powered by Supabase Edge Functions and Azure Document Intelligence for intelligent document processing and field extraction.

## 🚀 Features

- **Document Upload & Processing**: Upload PDFs and images for intelligent field extraction
- **Azure Document Intelligence**: Leverages Azure's prebuilt invoice model for accurate data extraction
- **Supabase Backend**: Serverless edge functions for scalable backend processing
- **Authentication**: Secure user authentication with Supabase Auth
- **Real-time Dashboard**: View and manage your processed documents
- **Field Extraction**: Extract custom fields from documents with confidence scores

## 📚 Documentation

- **[Quick Start Guide](./QUICKSTART.md)** - Get up and running quickly
- **[Migration Guide](./SUPABASE_MIGRATION.md)** - Detailed migration documentation
- **[Architecture Overview](./ARCHITECTURE.md)** - System architecture diagrams
- **[Deployment Guide](./supabase/DEPLOYMENT.md)** - Edge function deployment

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI/ML**: Azure Document Intelligence
- **Authentication**: Supabase Auth

## 📦 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Azure Document Intelligence resource
- Supabase CLI installed globally

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Supabase CLI

```bash
npm install -g supabase
```

### 3. Setup Supabase

```bash
# Login to Supabase
npm run supabase:login

# Link to your project
npm run supabase:link
```

### 4. Deploy Edge Functions

**Windows:**
```bash
deploy-functions.bat
```

**Manual:**
```bash
# Set secrets
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://docext.cognitiveservices.azure.com/
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_API_KEY=your_key_here
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
supabase secrets set GEMINI_API_KEY=your_key_here

# Deploy
npm run functions:deploy
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app!

## 📝 Environment Variables

Create a `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Azure Document Intelligence
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_API_KEY=your_azure_key
AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice

# Gemini API (optional)
GEMINI_API_KEY=your_gemini_key
```

## 🎯 Available Scripts

### Development
```bash
npm run dev                    # Start Next.js dev server
npm run supabase:start        # Start Supabase locally
npm run supabase:stop         # Stop Supabase
npm run functions:serve       # Serve edge functions locally
```

### Deployment
```bash
npm run functions:deploy      # Deploy edge functions
npm run functions:logs        # View function logs
npm run build                 # Build for production
npm run start                 # Start production server
```

### Testing
```bash
npm run lint                  # Run ESLint
```

## 🏗️ Project Structure

```
my-app/
├── app/                      # Next.js app directory
│   ├── auth/                 # Authentication pages
│   ├── dashboard/            # User dashboard
│   ├── extract/              # Document extraction page
│   └── document/             # Document details
├── components/               # React components
├── lib/                      # Utility functions
│   ├── client.ts             # Supabase client
│   ├── server.ts             # Supabase server
│   └── edge-functions.ts     # Edge function helper
├── supabase/
│   ├── functions/            # Edge functions
│   │   ├── extract/          # Document extraction function
│   │   └── _shared/          # Shared utilities
│   └── config.toml           # Supabase configuration
└── scripts/                  # Database scripts
```

## 🔐 Security

- JWT-based authentication
- Row Level Security (RLS) on database
- Secure secret management with Supabase
- API keys stored in edge function secrets
- User-scoped document access

## 📊 Database Schema

- **users**: User accounts
- **documents**: Uploaded documents
- **extracted_fields**: Extracted field data with confidence scores

## 🌐 Edge Functions

### Extract Function
- **Endpoint**: `https://your-project.supabase.co/functions/v1/extract`
- **Method**: POST
- **Auth**: Required (Bearer token)
- **Payload**:
  ```json
  {
    "documentId": "uuid",
    "fileUrl": "https://...",
    "fieldsToExtract": ["InvoiceId", "VendorName", "InvoiceTotal"]
  }
  ```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
```

Deploy to Vercel or Netlify following their deployment guides.

### Edge Functions (Supabase)
```bash
npm run functions:deploy
```

## 🐛 Troubleshooting

See [QUICKSTART.md](./QUICKSTART.md#troubleshooting) for common issues and solutions.

## 📖 Learn More

### Next.js
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

### Supabase
- [Supabase Documentation](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)

### Azure
- [Azure Document Intelligence](https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/)

## 📄 License

This project is private and proprietary.

## 🤝 Contributing

This is a private project. Please contact the project maintainers for contribution guidelines.

