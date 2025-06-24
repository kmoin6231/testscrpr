@echo off
echo Starting the backend server for testing...
cd backend
start cmd /k "npm start"
echo Backend server started. Opening browser...
timeout /t 5
start http://localhost:5001/health
echo.
echo To test downloads:
echo 1. Open http://localhost:3000 in your browser
echo 2. Enter "test_district" as the folder name
echo 3. Click "Show Download Progress" at the bottom
echo 4. Try downloading the PDF files
echo 5. Verify that they open correctly in Adobe Acrobat
echo.
