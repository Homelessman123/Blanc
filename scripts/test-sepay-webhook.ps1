param(
  [Parameter(Mandatory=$true)][string]$BaseUrl,
  [Parameter(Mandatory=$true)][string]$ApiKey,
  [Parameter(Mandatory=$false)][string]$OrderCode = "CHUB123456",
  [Parameter(Mandatory=$false)][int]$AmountVnd = 10000,
  [Parameter(Mandatory=$false)][string]$TxnId = "TEST_001"
)

$uri = "$BaseUrl/api/payments/sepay/webhook"
$headers = @{ Authorization = "ApiKey $ApiKey" }
$body = @{
  txnId = $TxnId
  transferType = "in"
  amount = $AmountVnd
  content = "Thanh toan $OrderCode"
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType "application/json" -Body $body -TimeoutSec 20
