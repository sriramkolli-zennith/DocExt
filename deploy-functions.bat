@echo off
REM Deploy Supabase Edge Functions
REM This script deploys the edge functions and sets up secrets

echo ================================
echo Supabase Edge Function Deployment
echo ================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Supabase CLI is not installed!
    echo Please install it with: npm install -g supabase
    exit /b 1
)

echo [1/4] Setting Edge Function Secrets...
echo.

supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=<your-azure-endpoint>
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_API_KEY=<your-azure-api-key>
supabase secrets set AZURE_DOCUMENT_INTELLIGENCE_MODEL_ID=prebuilt-invoice
supabase secrets set GEMINI_API_KEY=<your-gemini-api-key>

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to set secrets!
    echo Make sure you're logged in: supabase login
    echo And linked to project: supabase link --project-ref lputifqvrradmfedheov
    exit /b 1
)

echo.
echo [2/4] Secrets set successfully!
echo.

echo [3/4] Deploying edge functions...
echo.

supabase functions deploy upload-document
supabase functions deploy process-document
supabase functions deploy get-extracted-data

if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to deploy functions!
    exit /b 1
)

echo.
echo [4/4] Deployment complete!
echo.
echo ================================
echo Edge Function URLs:
echo https://lputifqvrradmfedheov.supabase.co/functions/v1/upload-document
echo https://lputifqvrradmfedheov.supabase.co/functions/v1/process-document
echo https://lputifqvrradmfedheov.supabase.co/functions/v1/get-extracted-data
echo ================================
echo.
echo To view logs, run: supabase functions logs extract
echo.
