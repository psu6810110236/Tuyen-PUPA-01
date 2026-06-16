import sqlite3
import re

db_path = r"C:\Users\User\.gemini\antigravity-cli\conversations\da0f1515-c6c1-4f5f-8757-d38697242249.db"

# Regex for Thai characters (UTF-8) and English printable chars
# Thai range in UTF-8: e0 b8 80 to e0 b9 bf
thai_pattern = rb'(?:\xe0\xb8[\x80-\xbf]|\xe0\xb9[\x80-\xbf]|[\x20-\x7e\n\r\t]){5,}'

def extract_strings(blob):
    if not blob:
        return ""
    matches = re.findall(thai_pattern, blob)
    decoded_matches = []
    for m in matches:
        try:
            s = m.decode('utf-8').strip()
            # Clean up double spaces, control chars
            s = re.sub(r'\s+', ' ', s)
            if len(s) > 10 and not s.startswith('file:///') and not s.startswith('C:\\Users'):
                decoded_matches.append(s)
        except Exception:
            pass
    return " | ".join(decoded_matches)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get some steps (first 5 and last 10)
cursor.execute("SELECT idx, step_type, status, step_payload FROM steps ORDER BY idx ASC;")
rows = cursor.fetchall()

print(f"Total steps: {len(rows)}")

# Print non-empty steps
extracted = []
for idx, step_type, status, payload in rows:
    text = extract_strings(payload)
    if text:
        extracted.append((idx, step_type, status, text))

print(f"Extracted {len(extracted)} steps with readable text.")

print("\n--- FIRST 5 READABLE STEPS ---")
for idx, step_type, status, text in extracted[:10]:
    print(f"Step {idx} (type={step_type}, status={status}): {text[:500]}...")

print("\n--- LAST 10 READABLE STEPS ---")
for idx, step_type, status, text in extracted[-20:]:
    print(f"Step {idx} (type={step_type}, status={status}): {text[:500]}...")

conn.close()
