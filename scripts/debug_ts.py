import tree_sitter_languages
from tree_sitter import Parser

print("Imported successfully")

try:
    print("Getting language...")
    language = tree_sitter_languages.get_language('python')
    print(f"Got language: {language}")

    print("Creating Parser...")
    parser = Parser(language)
    print("Parser created (passed lang in init)")
except Exception as e:
    print(f"Failed passing lang in init. Error: {e}")
    try:
        parser = Parser()
        print("Parser created (empty init)")
        print(dir(parser))
        if hasattr(parser, 'language'):
            parser.language = language
            print("Set parser.language")
        else:
             parser.set_language(language)
    except Exception as e:
        print(f"Failed empty init: {e}")

except Exception as e:
    print(f"General Error: {e}")
