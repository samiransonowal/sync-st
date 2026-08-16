"""
ST-fin-com-prog — User Directory Sync Script
Source: framework/documentation/users.yaml
Target: credentials/public/users.json

Reads users.yaml and generates a synchronized, formatted credentials/public/users.json file.
"""

import os
import sys
import json
import yaml

# Set encoding to utf-8 for Windows console safety
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

def sync_users_directory():
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    yaml_path = os.path.join(repo_root, "framework", "documentation", "users.yaml")
    json_path = os.path.join(repo_root, "credentials", "public", "users.json")

    print(f"Reading master YAML: {yaml_path}")
    with open(yaml_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    print(f"Writing synced JSON: {json_path}")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print("SUCCESS: User Directory successfully synced from YAML to JSON!")

if __name__ == "__main__":
    sync_users_directory()
