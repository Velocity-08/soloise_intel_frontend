import os
from pathlib import Path

# Use the directory where this script is located
ROOT_DIR = Path(__file__).resolve().parent

# Output folder
OUTPUT_DIR = ROOT_DIR / "txt"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Output file
OUTPUT_FILE = OUTPUT_DIR / "all_scripts.txt"

# File extensions to include
INCLUDE_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".css",
    ".scss",
    ".json",
    ".md",
    ".html",
}

# Folders to exclude
EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    ".git",
    "txt",
    "dist",
    "build",
    "coverage",
    "__pycache__",
}

print(f"Project Root : {ROOT_DIR}")
print(f"Output File  : {OUTPUT_FILE}")
print("-" * 80)

files_added = 0

with open(OUTPUT_FILE, "w", encoding="utf-8") as out_file:

    for root, dirs, files in os.walk(ROOT_DIR):

        # Remove excluded directories from traversal
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]

        for filename in files:
            file_path = Path(root) / filename

            if file_path.suffix.lower() not in INCLUDE_EXTENSIONS:
                continue

            try:
                relative_path = file_path.relative_to(ROOT_DIR)

                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                    errors="ignore"
                ) as infile:

                    content = infile.read()


                out_file.write("\n")
                out_file.write("=" * 100 + "\n")
                out_file.write(f"FILE: {relative_path}\n")
                out_file.write("=" * 100 + "\n\n")
                out_file.write(content)
                out_file.write("\n\n")

                files_added += 1
                print(f"✓ Added: {relative_path}")

            except Exception as e:
                print(f"✗ Error reading {file_path}: {e}")

print("-" * 80)
print(f"Total files added: {files_added}")
print(f"Output saved to: {OUTPUT_FILE}")

# Verify file exists
if OUTPUT_FILE.exists():
    print(f"Output file size: {OUTPUT_FILE.stat().st_size:,} bytes")
else:
    print("ERROR: Output file was not created.")