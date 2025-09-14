# ===============================
# CivicConnect Setup Script
# ===============================

Write-Host "Setting up CivicConnect..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is installed
Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow
try {
    $mongoVersion = mongod --version
    Write-Host "MongoDB is installed" -ForegroundColor Green
} catch {
    Write-Host "MongoDB not found. Installing MongoDB..." -ForegroundColor Yellow
    
    # Install MongoDB using Chocolatey
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        choco install mongodb -y
        Write-Host "MongoDB installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "Failed to install MongoDB. Please install manually from https://www.mongodb.com/try/download/community" -ForegroundColor Red
    }
}

# Start MongoDB service
Write-Host "Starting MongoDB service..." -ForegroundColor Yellow
try {
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Write-Host "MongoDB service started" -ForegroundColor Green
} catch {
    Write-Host "Could not start MongoDB service. Please start manually." -ForegroundColor Yellow
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "Failed to install backend dependencies" -ForegroundColor Red
    exit 1
}

# Create environment file
Write-Host "Setting up environment configuration..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Copy-Item "config.env.example" ".env"
    Write-Host "Environment file created" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists" -ForegroundColor Yellow
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Wait a moment for server to start
Start-Sleep -Seconds 3

# Seed database
Write-Host "Seeding database with sample data..." -ForegroundColor Yellow
Set-Location backend
npm run seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "Database seeding failed or already seeded" -ForegroundColor Yellow
}

# Go back to root directory
Set-Location ..

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Backend server is running on http://localhost:5000" -ForegroundColor White
Write-Host "2. Open frontend/user.html in your browser to test the citizen app" -ForegroundColor White
Write-Host "3. Open frontend/admin.html in your browser to test the admin dashboard" -ForegroundColor White
Write-Host "`nSample login credentials:" -ForegroundColor Cyan
Write-Host "Citizen: john@example.com / password123" -ForegroundColor White
Write-Host "Citizen: jane@example.com / password123" -ForegroundColor White
Write-Host "Admin: admin@civicconnect.com / admin123" -ForegroundColor White
Write-Host "Admin: manager@civicconnect.com / manager123" -ForegroundColor White
Write-Host "`nAPI Documentation: http://localhost:5000/api" -ForegroundColor Cyan
Write-Host "Health Check: http://localhost:5000/health" -ForegroundColor Cyan

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")