import os

# Root folder (your Next.js frontend folder)
ROOT_DIR = "."

# Output file
OUTPUT_FILE = "all_scripts.txt"

# File extensions to scan
SCRIPT_EXTENSIONS = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs"
}

# Folders to ignore
IGNORE_FOLDERS = {
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build"
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as out_file:
    for root, dirs, files in os.walk(ROOT_DIR):
        # Remove ignored folders from traversal
        dirs[:] = [d for d in dirs if d not in IGNORE_FOLDERS]

        for file in files:
            ext = os.path.splitext(file)[1]

            if ext in SCRIPT_EXTENSIONS:
                file_path = os.path.join(root, file)

                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()

                    out_file.write("=" * 80 + "\n")
                    out_file.write(f"FILE: {file_path}\n")
                    out_file.write("=" * 80 + "\n\n")
                    out_file.write(content)
                    out_file.write("\n\n\n")

                    print(f"Added: {file_path}")

                except Exception as e:
                    print(f"Failed to read {file_path}: {e}")

print(f"\nDone. All scripts saved to: {OUTPUT_FILE}")