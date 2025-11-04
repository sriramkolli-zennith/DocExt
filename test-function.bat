@echo off
REM Test Supabase Edge Function locally

echo ================================
echo Testing Extract Edge Function
echo ================================
echo.

REM Check if Supabase is running
echo Checking if Supabase is running...
curl -s http://127.0.0.1:54321 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Supabase is not running!
    echo Please start it with: npm run supabase:start
    exit /b 1
)

echo Supabase is running!
echo.

REM Get the anon key from .env.local
echo Reading anon key from .env.local...
for /f "tokens=2 delims==" %%a in ('findstr "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local') do set ANON_KEY=%%a

if "%ANON_KEY%"=="" (
    echo ERROR: Could not find NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
    exit /b 1
)

echo Anon key found!
echo.

echo Sending test request to edge function...
echo.

curl -i --location --request POST "http://127.0.0.1:54321/functions/v1/extract" ^
  --header "Authorization: Bearer %ANON_KEY%" ^
  --header "Content-Type: application/json" ^
  --data "{\"documentId\": \"test-123\", \"fileUrl\": \"https://raw.githubusercontent.com/Azure-Samples/cognitive-services-REST-api-samples/master/curl/form-recognizer/sample-invoice.pdf\", \"fieldsToExtract\": [\"InvoiceId\", \"VendorName\", \"InvoiceTotal\"]}"

echo.
echo.
echo ================================
echo Test complete!
echo ================================
