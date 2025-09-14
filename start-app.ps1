# ===============================
# CivicConnect - Start Application
# ===============================

Write-Host "Starting CivicConnect Application..." -ForegroundColor Green

# Check if MongoDB is running
Write-Host "Checking MongoDB status..." -ForegroundColor Yellow
try {
    $mongoStatus = Get-Service MongoDB -ErrorAction SilentlyContinue
    if ($mongoStatus -and $mongoStatus.Status -eq "Running") {
        Write-Host "MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "Starting MongoDB..." -ForegroundColor Yellow
        Start-Service MongoDB
        Start-Sleep -Seconds 3
        Write-Host "MongoDB started" -ForegroundColor Green
    }
} catch {
    Write-Host "MongoDB service not found. Please install MongoDB first." -ForegroundColor Red
    Write-Host "Download from: https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
    exit 1
}

# Check if .env file exists
if (!(Test-Path "backend\.env")) {
    Write-Host "Creating environment file..." -ForegroundColor Yellow
    Copy-Item "backend\config.env.example" "backend\.env"
    Write-Host "Environment file created" -ForegroundColor Green
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait for backend to start
Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

# Wait for frontend to start
Write-Host "Waiting for frontend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n🎉 CivicConnect is now running!" -ForegroundColor Green
Write-Host "`n📱 Access your application:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "API Health: http://localhost:5000/health" -ForegroundColor White

Write-Host "`n🔑 Login Credentials:" -ForegroundColor Cyan
Write-Host "Citizen: john@example.com / password123" -ForegroundColor White
Write-Host "Admin: admin@civicconnect.com / admin123" -ForegroundColor White

Write-Host "`n✨ New Features:" -ForegroundColor Cyan
Write-Host "✅ OTP Email Verification for Registration" -ForegroundColor White
Write-Host "✅ Enhanced Registration Flow" -ForegroundColor White
Write-Host "✅ Better Error Handling" -ForegroundColor White
Write-Host "✅ Mobile Responsive Design" -ForegroundColor White

Write-Host "`n📧 Email Configuration:" -ForegroundColor Yellow
Write-Host "To enable OTP emails, update backend\.env with your email settings:" -ForegroundColor White
Write-Host "EMAIL_USER=your_email@gmail.com" -ForegroundColor Gray
Write-Host "EMAIL_PASS=your_app_password" -ForegroundColor Gray

Write-Host "`n🚀 Ready to use! Open http://localhost:3000 in your browser." -ForegroundColor Green
