# Simple CivicConnect Setup Script
# Run this step by step if the main setup script has issues

Write-Host "CivicConnect Simple Setup" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Step 1: Install backend dependencies
Write-Host "`nStep 1: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install

# Step 2: Create environment file
Write-Host "`nStep 2: Creating environment file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item "config.env.example" ".env"
    Write-Host "Environment file created" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists" -ForegroundColor Yellow
}

# Step 3: Start MongoDB (manual)
Write-Host "`nStep 3: Please start MongoDB manually:" -ForegroundColor Yellow
Write-Host "Run: mongod --dbpath C:\data\db" -ForegroundColor White
Write-Host "Or start MongoDB service: Start-Service MongoDB" -ForegroundColor White

# Step 4: Start backend server
Write-Host "`nStep 4: Starting backend server..." -ForegroundColor Yellow
Write-Host "Run: npm run dev" -ForegroundColor White

# Step 5: Seed database
Write-Host "`nStep 5: Seeding database..." -ForegroundColor Yellow
Write-Host "Run: npm run seed" -ForegroundColor White

Write-Host "`nSetup instructions completed!" -ForegroundColor Green
Write-Host "Follow the steps above to complete the setup." -ForegroundColor Cyan

Set-Location ..
