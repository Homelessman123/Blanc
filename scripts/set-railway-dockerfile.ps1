# Railway API: Update Service Dockerfile Path
# Usage: .\set-railway-dockerfile.ps1

$SERVICE_ID = "905ce9b0-4e19-4e3d-b4d8-b87863ae4fb8"  # empathetic-prosperity
$DOCKERFILE_PATH = "Dockerfile.frontend"

# Get Railway token from CLI config
$railwayConfigPath = "$env:USERPROFILE\.railway\config.json"
if (-not (Test-Path $railwayConfigPath)) {
    Write-Error "Railway CLI not logged in. Run: railway login"
    exit 1
}

$config = Get-Content $railwayConfigPath | ConvertFrom-Json
$token = $config.user.token

if (-not $token) {
    Write-Error "No Railway access token found"
    exit 1
}

# Railway GraphQL API
$apiUrl = "https://backboard.railway.app/graphql/v2"

# GraphQL mutation to update service
$mutation = @'
mutation serviceInstanceUpdate {
  serviceInstanceUpdate(
    serviceId: "905ce9b0-4e19-4e3d-b4d8-b87863ae4fb8"
    input: { 
      builder: DOCKERFILE
      dockerfilePath: "Dockerfile.frontend"
    }
  ) {
    id
  }
}
'@

$body = @{
    query = $mutation
} | ConvertTo-Json

Write-Host "🚀 Updating service Dockerfile path..." -ForegroundColor Cyan
Write-Host "   Service ID: $SERVICE_ID"
Write-Host "   New Path: $DOCKERFILE_PATH"

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post `
        -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    } `
        -Body $body

    if ($response.errors) {
        Write-Error "GraphQL Error:"
        $response.errors | ForEach-Object { Write-Error $_.message }
        exit 1
    }

    Write-Host "✅ Successfully updated Dockerfile path!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will redeploy automatically"
    Write-Host "2. Check logs: railway logs"
    Write-Host "3. Or manual redeploy: railway redeploy"
    
}
catch {
    Write-Error "Failed to update service: $_"
    Write-Host ""
    Write-Host "Alternative: Update manually in Railway Dashboard" -ForegroundColor Yellow
    Write-Host "Settings → Build → Dockerfile Path → Dockerfile.frontend"
    exit 1
}
