import tree_sitter_languages
import os

class CodeParser:
    def __init__(self):
        self.parsers = {}
        self.supported_extensions = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".go": "go",
            ".rs": "rust",
            ".java": "java",
            ".c": "c",
            ".cpp": "cpp"
        }

    def get_parser(self, language_name: str):
        if language_name not in self.parsers:
            try:
                parser = tree_sitter_languages.get_parser(language_name)
                self.parsers[language_name] = parser
            except Exception as e:
                print(f"Error loading language {language_name}: {e}")
                import traceback
                traceback.print_exc()
                return None
        return self.parsers[language_name]

    def parse_file(self, file_path: str):
        """
        Parses a file and returns its AST (root node) and content.
        """
        ext = os.path.splitext(file_path)[1]
        language_name = self.supported_extensions.get(ext)
        
        if not language_name:
            return None, None

        parser = self.get_parser(language_name)
        if not parser:
            return None, None

        try:
            with open(file_path, "rb") as f:
                content = f.read()
            
            tree = parser.parse(content)
            return tree.root_node, content
        except Exception as e:
            print(f"Failed to parse {file_path}: {e}")
            return None, None

    def extract_definitions(self, root_node, content: bytes):
        """
        Extracts top-level class and function definitions.
        Simple heuristic: look for 'function_definition' or 'class_definition' nodes.
        Note: Exact node types vary by language (e.g. 'function_item' in Rust).
        """
        definitions = []
        
        cursor = root_node.walk()
        
        # This is a specialized simplified walker for demonstration
        # In production, this needs language-specific queries.
        
        # Python example node types
        node_types_of_interest = {
            "function_definition", "class_definition", 
            "method_definition", # JS/TS
            "func_literal" # Go
        }

        for child in root_node.children:
            if child.type in node_types_of_interest:
                self._add_definition(child, content, definitions)
            elif child.type == "decorated_definition":
                # Drill down to find the wrapped definition
                definition_node = child.children[-1]
                if definition_node.type in node_types_of_interest:
                     self._add_definition(definition_node, content, definitions)

        return definitions

    def chunk_file_generic(self, content: bytes, file_path: str):
        """
        Fallback chunker that just returns the whole file as one chunk if parsing failed or yielded no definitions.
        """
        try:
            text = content.decode("utf-8", errors="ignore")
            # Minimal constraint: ignore empty files
            if not text.strip():
                return []
            
            return [{
                "type": "file_content",
                "name": os.path.basename(file_path),
                "content": text,
                "start_line": 0,
                "end_line": len(text.splitlines())
            }]
        except:
            return []

    def _add_definition(self, node, content, definitions):
        start_byte = node.start_byte
        end_byte = node.end_byte
        code_snippet = content[start_byte:end_byte].decode("utf-8", errors="ignore")
        definitions.append({
            "type": node.type,
            "name": self._get_name(node, content) or "anonymous",
            "content": code_snippet,
            "start_line": node.start_point[0],
            "end_line": node.end_point[0]
        })

    def _get_name(self, node, content: bytes):
        # Very naive name extraction
        for child in node.children:
            if child.type == "identifier" or child.type == "name":
                 start = child.start_byte
                 end = child.end_byte
                 return content[start:end].decode("utf-8")
        return None

code_parser = CodeParser()
