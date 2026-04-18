#!/bin/bash

# Markdown Cleanup Script
# This script safely removes redundant markdown files from the repository

echo "=================================="
echo "  Markdown Files Cleanup Script  "
echo "=================================="
echo ""

# Define files to delete
files_to_delete=(
    # Root level duplicates
    "PROJECT_STRUCTURE.md"
    "PROJECT_STRUCTURE_DETAILED.md"
    "FRONTEND_ML_SETUP.md"
    "ML_COMPLETE_IMPLEMENTATION.md"
    "ML_IMPLEMENTATION_COMPLETE.md"
    "REDIS_INSTALLATION_GUIDE.md"
    "REDIS_SETUP.md"
    "REAL_DATA_IMPLEMENTATION.md"
    
    # Admin/Temporary files
    "ADMIN_CREDENTIALS.md"
    "AFTER_CLEARING_DATABASE.md"
    "CLEAR_FAKE_DATA.md"
    "CREATE_LISTING_FUNCTIONAL.md"
    
    # Backend duplicates
    "backend/ML_PHASE1_IMPLEMENTATION.md"
    "backend/ML_PHASE2_IMPLEMENTATION.md"
    "backend/ML_PHASE2_SUMMARY.md"
    "backend/ML_PHASE3_IMPLEMENTATION.md"
    "backend/ML_PHASE3_SUMMARY.md"
    "backend/ML_QUICKSTART.md"
    "backend/ML_API_EXAMPLES.md"
    "backend/ML_TESTING_GUIDE.md"
    "backend/ML_TESTING_SUMMARY.md"
    "backend/ML_TEST_QUICKREF.md"
    "backend/NIGHTLY_JOBS_IMPLEMENTATION.md"
    
    # Frontend duplicates
    "frontend/FINAL_STRUCTURE.md"
    "frontend/FINAL_SUMMARY.md"
    "frontend/ML_QUICKSTART.md"
    "frontend/ML_UI_COMPONENTS.md"
    "frontend/ML_UI_IMPLEMENTATION_SUMMARY.md"
    "frontend/PROJECT_COMPLETE.md"
    "frontend/PROJECT_STRUCTURE.md"
    "frontend/QUICK_SETUP.md"
    "frontend/START_HERE.md"
    "frontend/TASK7_IMPLEMENTATION_SUMMARY.md"
)

# Step 1: Preview files to be deleted
echo "Step 1: Files to be deleted (Preview)"
echo "======================================"
echo ""

existing_files=()
missing_files=()

for file in "${files_to_delete[@]}"; do
    if [ -f "$file" ]; then
        existing_files+=("$file")
        size=$(wc -c < "$file")
        echo "  [EXISTS] $file ($size bytes)"
    else
        missing_files+=("$file")
        echo "  [MISSING] $file"
    fi
done

echo ""
echo "Summary:"
echo "  Total files to delete: ${#files_to_delete[@]}"
echo "  Existing files: ${#existing_files[@]}"
echo "  Already deleted: ${#missing_files[@]}"
echo ""

if [ ${#existing_files[@]} -eq 0 ]; then
    echo "No files to delete. Cleanup already complete!"
    exit 0
fi

# Step 2: Confirm deletion
echo "Step 2: Confirm Deletion"
echo "========================"
echo ""
echo "This will delete ${#existing_files[@]} markdown files."
echo ""
read -p "Do you want to proceed? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo ""
    echo "Cleanup cancelled by user."
    exit 0
fi

# Step 3: Delete files
echo ""
echo "Step 3: Deleting Files"
echo "======================"
echo ""

deleted_count=0
failed_count=0

for file in "${existing_files[@]}"; do
    if rm -f "$file"; then
        echo "  [DELETED] $file"
        ((deleted_count++))
    else
        echo "  [FAILED] $file"
        ((failed_count++))
    fi
done

echo ""
echo "Deletion Summary:"
echo "  Successfully deleted: $deleted_count"
echo "  Failed: $failed_count"
echo ""

# Step 4: Git operations
echo "Step 4: Git Operations"
echo "======================"
echo ""

read -p "Do you want to remove these files from git tracking? (yes/no): " git_confirmation

if [ "$git_confirmation" == "yes" ]; then
    echo ""
    echo "Removing files from git..."
    
    for file in "${existing_files[@]}"; do
        git rm --cached "$file" 2>/dev/null && echo "  [GIT REMOVED] $file" || true
    done
    
    echo ""
    echo "Git status:"
    git status --short
    
    echo ""
    read -p "Do you want to commit these changes? (yes/no): " commit_confirmation
    
    if [ "$commit_confirmation" == "yes" ]; then
        git add -A
        git commit -m "cleanup: removed $deleted_count redundant markdown files

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
        
        echo ""
        echo "Changes committed successfully!"
    else
        echo ""
        echo "Changes staged but not committed. Run 'git commit' manually."
    fi
else
    echo ""
    echo "Git operations skipped. Files deleted locally only."
fi

# Step 5: Final summary
echo ""
echo "=================================="
echo "  Cleanup Complete!               "
echo "=================================="
echo ""
echo "Summary:"
echo "  Files deleted: $deleted_count"
echo "  Files failed: $failed_count"
echo ""
echo "Essential documentation retained:"
echo "  - README.md (main docs)"
echo "  - SETUP.md (setup guide)"
echo "  - CONTRIBUTING.md (contribution guide)"
echo "  - API.md (API documentation)"
echo "  - DEPLOYMENT.md (deployment guide)"
echo "  - ML_COMPLETE_SUMMARY.md (ML overview)"
echo "  - ML_DEPLOYMENT_CHECKLIST.md (ML deployment)"
echo "  - ML_DEVELOPER_QUICKREF.md (ML quick reference)"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git status"
echo "  2. Test the application"
echo "  3. Push changes: git push"
echo ""
