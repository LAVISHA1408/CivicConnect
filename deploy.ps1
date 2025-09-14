# ===============================
# CivicConnect Deployment Script
# ===============================

Write-Host "Deploying CivicConnect..." -ForegroundColor Green

# Check if Docker is installed
Write-Host "Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker version: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found. Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "Docker Compose version: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker Compose not found. Please install Docker Desktop with Compose support" -ForegroundColor Red
    exit 1
}

# Create environment file for production
Write-Host "Creating production environment file..." -ForegroundColor Yellow
if (!(Test-Path "backend/.env")) {
    Copy-Item "backend/config.env.example" "backend/.env"
    Write-Host "Environment file created" -ForegroundColor Green
} else {
    Write-Host "Environment file already exists" -ForegroundColor Yellow
}

# Build and start services
Write-Host "Building and starting services..." -ForegroundColor Yellow
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to start
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Seed database
Write-Host "Seeding database..." -ForegroundColor Yellow
docker-compose exec backend npm run seed

Write-Host "`nDeployment completed successfully!" -ForegroundColor Green
Write-Host "`nYour application is now running:" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend API: http://localhost:5000" -ForegroundColor White
Write-Host "API Health: http://localhost:5000/health" -ForegroundColor White

Write-Host "`nSample login credentials:" -ForegroundColor Cyan
Write-Host "Citizen: john@example.com / password123" -ForegroundColor White
Write-Host "Admin: admin@civicconnect.com / admin123" -ForegroundColor White

Write-Host "`nTo stop the application:" -ForegroundColor Yellow
Write-Host "docker-compose down" -ForegroundColor White

Write-Host "`nTo view logs:" -ForegroundColor Yellow
Write-Host "docker-compose logs -f" -ForegroundColor White
