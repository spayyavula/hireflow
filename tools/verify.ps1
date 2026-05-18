param(
    [switch]$SkipApiParity,
    [switch]$SkipFrontend,
    [switch]$SkipBackend,
    [switch]$IncludeE2E
)

$ErrorActionPreference = 'Stop'

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host "`n==> $Name" -ForegroundColor Cyan
    & $Action
}

Push-Location $PSScriptRoot\..
try {
    if (-not $SkipApiParity) {
        Invoke-Step -Name 'API contract parity' -Action {
            node tools/check-api-parity.mjs
        }
    }

    Invoke-Step -Name 'Backend dependency consistency' -Action {
        node tools/check-backend-deps.mjs
    }

    if (-not $SkipFrontend) {
        Invoke-Step -Name 'Frontend unit tests' -Action {
            Push-Location frontend
            try {
                npm test
            }
            finally {
                Pop-Location
            }
        }
    }

    if (-not $SkipBackend) {
        Invoke-Step -Name 'Backend unit and integration tests' -Action {
            Push-Location backend
            try {
                pytest -m "unit or integration"
            }
            finally {
                Pop-Location
            }
        }
    }

    if ($IncludeE2E) {
        Invoke-Step -Name 'Frontend PR e2e subset' -Action {
            Push-Location frontend
            try {
                npm run test:e2e:pr
            }
            finally {
                Pop-Location
            }
        }
    }

    Write-Host "`nVerification completed successfully." -ForegroundColor Green
}
finally {
    Pop-Location
}
