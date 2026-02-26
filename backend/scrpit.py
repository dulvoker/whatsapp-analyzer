from chat_parser import parse_chat
from analytics import compute_analytics

with open("_chat.txt", "r", encoding="utf-8") as f:
    content = f.read()

print(len(content))

# Print first 5 raw lines to inspect the format
lines = content.splitlines()
for line in lines[:5]:
    print(repr(line))

messages = parse_chat(content)

print(f"Total messages parsed: {len(messages)}")



print(compute_analytics(messages=messages))