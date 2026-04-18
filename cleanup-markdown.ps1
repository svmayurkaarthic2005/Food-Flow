# Markdown Cleanup Script
# This script safely removes redundant markdown files from the repository

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Markdown Files Cleanup Script  " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Define files to delete
$filesToDelete = @(
    # Root level duplicates
    "PROJECT_STRUCTURE.md",
    "PROJECT_STRUCTURE_DETAILED.md",
    "FRONTEND_ML_SETUP.md",
    "ML_COMPLETE_IMPLEMENTATION.md",
    "ML_IMPLEMENTATION_COMPLETE.md",
    "REDIS_INSTALLATION_GUIDE.md",
    "REDIS_SETUP.md",
    "REAL_DATA_IMPLEMENTATION.md",
    
    # Admin/Temporary files
    "ADMIN_CREDENTIALS.md",
    "AFTER_CLEARING_DATABASE.md",
    "CLEAR_FAKE_DATA.md",
    "CREATE_LISTING_FUNCTIONAL.md",
    
    # Backend duplicates
    "backend\ML_PHASE1_IMPLEMENTATION.md",
    "backend\ML_PHASE2_IMPLEMENTATION.md",
    "backend\ML_PHASE2_SUMMARY.md",
    "backend\ML_PHASE3_IMPLEMENTATION.md",
    "backend\ML_PHASE3_SUMMARY.md",
    "backend\ML_QUICKSTART.md",
    "backend\ML_API_EXAMPLES.md",
    "backend\ML_TESTING_GUIDE.md",
    "backend\ML_TESTING_SUMMARY.md",
    "backend\ML_TEST_QUICKREF.md",
    "backend\NIGHTLY_JOBS_IMPLEMENTATION.md",
    
    # Frontend duplicates
    "frontend\FINAL_STRUCTURE.md",
    "frontend\FINAL_SUMMARY.md",
    "frontend\ML_QUICKSTART.md",
    "frontend\ML_UI_COMPONENTS.md",
    "frontend\ML_UI_IMPLEMENTATION_SUMMARY.md",
    "frontend\PROJECT_COMPLETE.md",
    "frontend\PROJECT_STRUCTURE.md",
    "frontend\QUICK_SETUP.md",
    "frontend\START_HERE.md",
    "frontend\TASK7_IMPLEMENTATION_SUMMARY.md"
)

# Step 1: Preview files to be deleted
Write-Host "Step 1: Files to be deleted (Preview)" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""

$existingFiles = @()
$missingFiles = @()

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        $existingFiles += $file
        $size = (Get-Item $file).Length
        Write-Host "  [EXISTS] $file ($size bytes)" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "  [MISSING] $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Total files to delete: $($filesToDelete.Count)" -ForegroundColor White
Write-Host "  Existing files: $($existingFiles.Count)" -ForegroundColor Green
Write-Host "  Already deleted: $($missingFiles.Count)" -ForegroundColor Gray
Write-Host ""

if ($existingFiles.Count -eq 0) {
    Write-Host "No files to delete. Cleanup already complete!" -ForegroundColor Green
    exit 0
}

# Step 2: Confirm deletion
Write-Host "Step 2: Confirm Deletion" -ForegroundColor Yellow
Write-Host "========================" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will delete $($existingFiles.Count) markdown files." -ForegroundColor White
Write-Host ""
$confirmation = Read-Host "Do you want to proceed? (yes/no)"

if ($confirmation -ne "yes") {
    Write-Host ""
    Write-Host "Cleanup cancelled by user." -ForegroundColor Yellow
    exit 0
}

# Step 3: Delete files
Write-Host ""
Write-Host "Step 3: Deleting Files" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host ""

$deletedCount = 0
$failedCount = 0

foreach ($file in $existingFiles) {
    try {
        Remove-Item $file -Force
        Write-Host "  [DELETED] $file" -ForegroundColor Green
        $deletedCount++
    } catch {
        Write-Host "  [FAILED] $file - $($_.Exception.Message)" -ForegroundColor Red
        $failedCount++
    }
}

Write-Host ""
Write-Host "Deletion Summary:" -ForegroundColor Cyan
Write-Host "  Successfully deleted: $deletedCount" -ForegroundColor Green
Write-Host "  Failed: $failedCount" -ForegroundColor Red
Write-Host ""

# Step 4: Git operations
Write-Host "Step 4: Git Operations" -ForegroundColor Yellow
Write-Host "======================" -ForegroundColor Yellow
Write-Host ""

$gitConfirmation = Read-Host "Do you want to remove these files from git tracking? (yes/no)"

if ($gitConfirmation -eq "yes") {
    Write-Host ""
    Write-Host "Removing files from git..." -ForegroundColor White
    
    foreach ($file in $existingFiles) {
        try {
            git rm --cached $file 2>$null
            Write-Host "  [GIT REMOVED] $file" -ForegroundColor Green
        } catch {
            # File might not be tracked, ignore error
        }
    }
    
    Write-Host ""
    Write-Host "Git status:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    $commitConfirmation = Read-Host "Do you want to commit these changes? (yes/no)"
    
    if ($commitConfirmation -eq "yes") {
        git add -A
        git commit -m "cleanup: removed $deletedCount redundant markdown files

- Consolidated ML documentation into 3 comprehensive files
- Removed duplicate project structure docs
- Removed temporary admin/implementation notes
- Removed superseded phase documentation

Kept essential docs:
- README.md, SETUP.md, CONTRIBUTING.md
- API.md, DEPLOYMENT.md
- ML_COMPLETE_SUMMARY.md
- ML_DEPLOYMENT_CHECKLIST.md
- ML_DEVELOPER_QUICKREF.md"
        
        Write-Host ""
        Write-Host "Changes committed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Changes staged but not committed. Run 'git commit' manually." -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Git operations skipped. Files deleted locally only." -ForegroundColor Yellow
}

# Step 5: Final summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Cleanup Complete!               " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  Files deleted: $deletedCount" -ForegroundColor Green
Write-Host "  Files failed: $failedCount" -ForegroundColor Red
Write-Host ""
Write-Host "Essential documentation retained:" -ForegroundColor Cyan
Write-Host "  - README.md (main docs)" -ForegroundColor White
Write-Host "  - SETUP.md (setup guide)" -ForegroundColor White
Write-Host "  - CONTRIBUTING.md (contribution guide)" -ForegroundColor White
Write-Host "  - API.md (API documentation)" -ForegroundColor White
Write-Host "  - DEPLOYMENT.md (deployment guide)" -ForegroundColor White
Write-Host "  - ML_COMPLETE_SUMMARY.md (ML overview)" -ForegroundColor White
Write-Host "  - ML_DEPLOYMENT_CHECKLIST.md (ML deployment)" -ForegroundColor White
Write-Host "  - ML_DEVELOPER_QUICKREF.md (ML quick reference)" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the changes: git status" -ForegroundColor White
Write-Host "  2. Test the application" -ForegroundColor White
Write-Host "  3. Push changes: git push" -ForegroundColor White
Write-Host ""
