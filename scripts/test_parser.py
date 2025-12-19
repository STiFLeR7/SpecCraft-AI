from backend.ingestion.parser import code_parser
import os

# Test on projects.py
test_file = "backend/api/v1/endpoints/projects.py"
abs_path = os.path.abspath(test_file)

print(f"Testing parser on: {abs_path}")

try:
    root, content = code_parser.parse_file(abs_path)
    if not root:
        print("Failed to parse file")
        exit(1)

    definitions = code_parser.extract_definitions(root, content)
    print(f"Found {len(definitions)} definitions:")
    
    print("\n--- Top Level Nodes ---")
    for child in root.children:
        print(f"Type: {child.type}")
    print("-----------------------")

    for d in definitions:
        print(f"- [{d['type']}] {d['name']} (Lines {d['start_line']}-{d['end_line']})")

except Exception as e:
    print(f"Error: {e}")
