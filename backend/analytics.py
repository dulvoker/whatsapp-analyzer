import re
from collections import Counter

import pandas as pd

from chat_parser import Message

STOPWORDS = {
    # English
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "i", "you", "he", "she",
    "we", "they", "it", "me", "him", "her", "us", "them", "my", "your",
    "his", "our", "their", "this", "that", "these", "those", "what",
    "which", "who", "not", "no", "so", "if", "as", "up", "out", "about",
    "into", "through", "just", "than", "then", "there", "from", "by",
    "its", "all", "one", "get", "got", "like", "ok", "okay", "yeah",
    "yes", "lol", "im", "dont", "didnt", "cant", "going", "really",
    "know", "think", "time", "good", "great", "want", "make", "see",
    "come", "back", "well", "too", "also", "now", "oh", "ah", "haha",
    "hahaha", "hey", "hi", "bye", "am", "pm",
    # Spanish
    "el", "la", "los", "las", "un", "una", "unos", "unas", "y", "o",
    "de", "del", "en", "con", "por", "para", "que", "se", "le", "les",
    "lo", "me", "te", "nos", "es", "son", "fue", "ser", "estar", "no",
    "si", "como", "pero", "muy", "mas", "ya", "mi", "tu", "su", "al",
    "yo", "también", "porque", "cuando", "donde", "todo", "esta", "este",
    "eso", "ese", "esa", "más", "así", "hay", "bien", "aquí", "ahí",
    "sí", "qué", "él", "ella", "ellos", "nosotros",
}

EMOJI_PATTERN = re.compile(
    "["
    "\U0001F600-\U0001F64F"
    "\U0001F300-\U0001F5FF"
    "\U0001F680-\U0001F6FF"
    "\U0001F1E0-\U0001F1FF"
    "\U00002500-\U00002BEF"
    "\U00002702-\U000027B0"
    "\U0001f926-\U0001f937"
    "\U00010000-\U0010ffff"
    "\u2640-\u2642"
    "\u2600-\u2B55"
    "\u231a"
    "\u23cf"
    "\u23e9"
    "\u3030"
    "]+",
    re.UNICODE,
)

DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def _extract_emojis(text: str) -> list[str]:
    matches = EMOJI_PATTERN.findall(text)
    result = []
    for seq in matches:
        result.extend(list(seq))
    return [c for c in result if c.strip()]


def compute_analytics(messages: list[Message]) -> dict:
    df = pd.DataFrame(
        [
            {
                "timestamp": m.timestamp,
                "sender": m.sender,
                "text": m.text,
                "is_media": m.is_media,
            }
            for m in messages
        ]
    )

    if df.empty:
        return {"error": "No messages found"}

    df["date"] = df["timestamp"].dt.date
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.day_name()
    df["word_count"] = df["text"].apply(lambda t: len(t.split()) if t else 0)
    df["char_count"] = df["text"].apply(lambda t: len(t) if t else 0)

    text_only = df[~df["is_media"]]

    # Summary
    total_messages = len(df)
    total_words = int(text_only["word_count"].sum())
    participants = sorted(df["sender"].unique().tolist())
    date_range = {
        "start": str(df["timestamp"].min().date()),
        "end": str(df["timestamp"].max().date()),
    }
    day_counts = df.groupby("date").size()
    most_active_day = {
        "date": str(day_counts.idxmax()),
        "count": int(day_counts.max()),
    }

    # Messages per participant
    messages_per_participant = (
        df.groupby("sender")
        .size()
        .reset_index(name="count")
        .sort_values("count", ascending=False)
        .to_dict(orient="records")
    )

    # Avg message length (text only)
    avg_length = (
        text_only.groupby("sender")["char_count"]
        .mean()
        .reset_index()
        .rename(columns={"char_count": "avg_length"})
    )
    avg_length["avg_length"] = avg_length["avg_length"].round(1)
    avg_length_per_participant = avg_length.to_dict(orient="records")

    # Activity by hour
    by_hour = (
        df.groupby("hour")
        .size()
        .reindex(range(24), fill_value=0)
        .reset_index(name="count")
        .to_dict(orient="records")
    )

    # Activity by day of week
    by_dow = (
        df.groupby("day_of_week")
        .size()
        .reindex(DAY_ORDER, fill_value=0)
        .reset_index(name="count")
        .rename(columns={"day_of_week": "day"})
        .to_dict(orient="records")
    )

    # Messages over time
    total_over_time = (
        df.groupby("date")
        .size()
        .reset_index(name="count")
        .assign(date=lambda x: x["date"].astype(str))
        .to_dict(orient="records")
    )
    per_participant_over_time: dict = {}
    for sender in participants:
        series = (
            df[df["sender"] == sender]
            .groupby("date")
            .size()
            .reset_index(name="count")
            .assign(date=lambda x: x["date"].astype(str))
            .to_dict(orient="records")
        )
        per_participant_over_time[sender] = series

    messages_over_time = {
        "total": total_over_time,
        "per_participant": per_participant_over_time,
    }

    # Top 20 words
    all_text = " ".join(text_only["text"].dropna().tolist()).lower()
    all_text_clean = EMOJI_PATTERN.sub("", all_text)
    all_text_clean = re.sub(r"[^\w\s]", "", all_text_clean)
    words = [w for w in all_text_clean.split() if w not in STOPWORDS and len(w) > 1]
    top_words = [{"word": w, "count": c} for w, c in Counter(words).most_common(20)]

    # Top 10 emojis
    all_text_raw = " ".join(df["text"].dropna().tolist())
    emoji_list = _extract_emojis(all_text_raw)
    top_emojis = [{"emoji": e, "count": c} for e, c in Counter(emoji_list).most_common(10)]

    # Per-participant hour/dow (for client-side filtering)
    per_participant_by_hour: dict = {}
    per_participant_by_dow: dict = {}
    for sender in participants:
        sdf = df[df["sender"] == sender]
        per_participant_by_hour[sender] = (
            sdf.groupby("hour")
            .size()
            .reindex(range(24), fill_value=0)
            .reset_index(name="count")
            .to_dict(orient="records")
        )
        per_participant_by_dow[sender] = (
            sdf.groupby("day_of_week")
            .size()
            .reindex(DAY_ORDER, fill_value=0)
            .reset_index(name="count")
            .rename(columns={"day_of_week": "day"})
            .to_dict(orient="records")
        )

    return {
        "summary": {
            "total_messages": total_messages,
            "total_words": total_words,
            "participants": participants,
            "date_range": date_range,
            "most_active_day": most_active_day,
        },
        "messages_per_participant": messages_per_participant,
        "avg_length_per_participant": avg_length_per_participant,
        "messages_by_hour": by_hour,
        "messages_by_dow": by_dow,
        "messages_over_time": messages_over_time,
        "top_words": top_words,
        "top_emojis": top_emojis,
        "per_participant_by_hour": per_participant_by_hour,
        "per_participant_by_dow": per_participant_by_dow,
    }
