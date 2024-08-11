#!/bin/bash
# Usage: ./code_layout.sh [REPO_DIR] [OUTPUT_FILE] [FILE_EXTENSIONS]
# Description: Combine all code files in a repository into a single file, skipping node_modules
# Example: ./code_layout.sh ~/projects/my_project combined_code_dump.txt py js html css java cpp h cs

# Directory of the repository (default to current directory if not specified)
REPO_DIR="${1:-.}"

# Output file (default to combined_code_dump.txt if not specified)
OUTPUT_FILE="${2:-combined_code_dump.txt}"

# List of file extensions to include (default to a predefined list if not specified)
FILE_EXTENSIONS=("${@:3}")
if [ ${#FILE_EXTENSIONS[@]} -eq 0 ]; then
    FILE_EXTENSIONS=("py" "js" "java" "cpp" "ts")
fi

# Empty the output file if it exists
> "$OUTPUT_FILE"

# Function to combine files
combine_files() {
    local dir="$1"
    # local find_command="find \"$dir\" -type d -name node_modules -prune -o -type f \\( -name \"*.${FILE_EXTENSIONS[0]}\""
    local find_command="find \"$dir\" -type f \\( -name \"*.${FILE_EXTENSIONS[0]}\""
    for ext in "${FILE_EXTENSIONS[@]:1}"; do
        find_command+=" -o -name \"*.$ext\""
    done
    # find_command+=" \\) -print0"
    find_command+=" \\) -not -path \"*/node_modules/*\" -print0"

    eval $find_command | while IFS= read -r -d '' file; do
        echo "// File: $file" >> "$OUTPUT_FILE"
        cat "$file" >> "$OUTPUT_FILE"
        echo -e "\n\n" >> "$OUTPUT_FILE"
    done
}

# Combine the files
combine_files "$REPO_DIR"

echo "All code files have been combined into $OUTPUT_FILE"
