import re
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

ANDROID_PATTERN = re.compile(
    r"^(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}),\s"
    r"(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\s-\s"
    r"([^:]+):\s(.+)$"
)

IOS_PATTERN = re.compile(
    r"^\[(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}),\s"
    r"(\d{1,2}:\d{2}(?::\d{2})?(?:[\s\u202f]?[AaPp][Mm])?)\]\s"
    r"([^:]+):\s(.+)$"
)

MEDIA_PATTERN = re.compile(
    r"^\u200e?\u202a?(image|video|audio|document|sticker|GIF|Contact card|voice message) omitted$",
    re.IGNORECASE,
)

SYSTEM_PHRASES = [
    "messages and calls are end-to-end encrypted",
    "this message was deleted",
    "you deleted this message",
    "missed voice call",
    "missed video call",
    "changed the subject",
    "changed this group",
    "added",
    "removed",
    "left",
    "joined using this group",
    "created group",
    "changed the group",
    "pinned a message",
    "turned on disappearing messages",
    "turned off disappearing messages",
]

DATETIME_FORMATS = [
    "%d/%m/%Y %H:%M:%S",
    "%d/%m/%Y %H:%M",
    "%m/%d/%Y %H:%M:%S",
    "%m/%d/%Y %H:%M",
    "%d/%m/%y %H:%M:%S",
    "%d/%m/%y %H:%M",
    "%m/%d/%y %H:%M:%S",
    "%m/%d/%y %H:%M",
    "%d/%m/%Y %I:%M:%S %p",
    "%d/%m/%Y %I:%M %p",
    "%m/%d/%Y %I:%M:%S %p",
    "%m/%d/%Y %I:%M %p",
    "%d/%m/%y %I:%M:%S %p",
    "%d/%m/%y %I:%M %p",
    "%m/%d/%y %I:%M:%S %p",
    "%m/%d/%y %I:%M %p",
]


@dataclass
class Message:
    timestamp: datetime
    sender: str
    text: str
    is_media: bool


def _detect_format(lines: list[str]) -> str:
    for line in lines:
        stripped = line.strip()
        if stripped:
            return "ios" if stripped.startswith("[") else "android"
    return "android"


def _parse_datetime(date_str: str, time_str: str) -> Optional[datetime]:
    combined = f"{date_str} {time_str}".strip()
    # Normalize narrow no-break space (\u202f) and other whitespace before AM/PM to regular space
    combined = combined.replace("\u202f", " ")
    # Normalize dot-separated dates to slashes (20.06.2023 -> 20/06/2023)
    combined = re.sub(r"^(\d{1,2})\.(\d{1,2})\.(\d{2,4})", r"\1/\2/\3", combined)
    # Normalize AM/PM spacing
    combined = re.sub(r"\s?([AaPp][Mm])$", r" \1", combined).strip()
    for fmt in DATETIME_FORMATS:
        try:
            return datetime.strptime(combined, fmt)
        except ValueError:
            continue
    return None


def _is_system_message(text: str) -> bool:
    text_lower = text.lower().strip()
    return any(phrase in text_lower for phrase in SYSTEM_PHRASES)


def parse_chat(content: str) -> list[Message]:
    """
    Parse a WhatsApp export .txt file.
    Returns a list of Message objects. System messages are skipped.
    Media messages are kept but marked with is_media=True.
    """
    # Strip BOM if present
    content = content.lstrip("\ufeff")

    lines = content.splitlines()
    fmt = _detect_format(lines)
    pattern = IOS_PATTERN if fmt == "ios" else ANDROID_PATTERN

    messages: list[Message] = []
    current: Optional[Message] = None

    for line in lines:
        match = pattern.match(line)
        if match:
            date_str, time_str, sender, text = match.groups()
            sender = sender.strip()
            text = text.strip()

            if _is_system_message(text):
                current = None
                continue

            ts = _parse_datetime(date_str, time_str)
            if ts is None:
                # Unparseable timestamp - treat as continuation
                if current is not None:
                    current.text += "\n" + line
                continue

            is_media = bool(MEDIA_PATTERN.match(text))
            current = Message(timestamp=ts, sender=sender, text=text, is_media=is_media)
            messages.append(current)
        else:
            # Continuation line (multi-line message)
            if current is not None and line.strip():
                current.text += "\n" + line

    return messages
