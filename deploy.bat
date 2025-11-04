@echo off
echo ========================================
echo   Supabase Edge Functions Deployment
echo ========================================
echo.
echo Step 1: Make sure Docker Desktop is running
echo         (Check your system tray for the Docker icon)
echo.
pause
echo.
echo Step 2: Deploying functions...
echo.

call npx supabase functions deploy upload-document-backend --project-ref lputifqvrradmfedheov
if %ERRORLEVEL% NEQ 0 (
    echo Failed to deploy upload-document-backend
    pause
    exit /b 1
)

call npx supabase functions deploy process-document-backend --project-ref lputifqvrradmfedheov  
if %ERRORLEVEL% NEQ 0 (
    echo Failed to deploy process-document-backend
    pause
    exit /b 1
)

call npx supabase functions deploy get-extracted-data-backend --project-ref lputifqvrradmfedheov
if %ERRORLEVEL% NEQ 0 (
    echo Failed to deploy get-extracted-data-backend
    pause
    exit /b 1
)

echo.
echo ========================================
echo   All functions deployed successfully!
echo ========================================
echo.
pause
