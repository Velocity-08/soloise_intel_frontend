import os
from pathlib import Path

BACKEND_DIR = "backend"

TARGET_FOLDERS = ["gateway", "stages"]

SCRIPT_EXTENSIONS = {
    ".py",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".sh",
    ".bash",
    ".ps1",
    ".java",
    ".go",
    ".php",
    ".rb",
    ".cs"
}


def extract_scripts(folder_path):
    results = []

    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_path = Path(root) / file

            if file_path.suffix.lower() in SCRIPT_EXTENSIONS:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()

                    results.append({
                        "name": file,
                        "path": str(file_path),
                        "code": content
                    })

                except Exception as e:
                    results.append({
                        "name": file,
                        "path": str(file_path),
                        "code": f"ERROR READING FILE: {e}"
                    })

    return results


def main():
    backend = Path(BACKEND_DIR)

    if not backend.exists():
        print(f"Backend folder not found: {backend}")
        return

    all_scripts = []

    for folder in TARGET_FOLDERS:
        target = backend / folder

        if target.exists():
            print(f"\nScanning: {target}")
            all_scripts.extend(extract_scripts(target))
        else:
            print(f"Folder not found: {target}")

    output_file = "all_scripts_dump.txt"

    with open(output_file, "w", encoding="utf-8") as out:
        for script in all_scripts:
            out.write("=" * 100 + "\n")
            out.write(f"FILE NAME: {script['name']}\n")
            out.write(f"PATH: {script['path']}\n")
            out.write("=" * 100 + "\n\n")
            out.write(script["code"])
            out.write("\n\n\n")

    print(f"\nDone. Extracted {len(all_scripts)} scripts.")
    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()