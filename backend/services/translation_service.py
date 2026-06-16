import json
import re
from typing import Iterable

from sqlalchemy.orm import Session

from database import SessionLocal
from models.translation import Translation
from services.ai_service import generate_text

THAI_RE = re.compile(r"[\u0E00-\u0E7F]")


def contains_thai(text: str) -> bool:
    return bool(THAI_RE.search(text or ""))


def _clean_json(text: str) -> str:
    return text.strip().replace("```json", "").replace("```", "").strip()


def _get_cached(db: Session, source_text: str, direction: str) -> str | None:
    row = (
        db.query(Translation)
        .filter(Translation.source_text == source_text, Translation.direction == direction)
        .first()
    )
    return row.translated_text if row else None


def _save_cached(db: Session, source_text: str, translated_text: str, direction: str) -> None:
    existing = (
        db.query(Translation)
        .filter(Translation.source_text == source_text, Translation.direction == direction)
        .first()
    )
    if existing:
        existing.translated_text = translated_text
    else:
        db.add(
            Translation(
                source_text=source_text,
                translated_text=translated_text,
                direction=direction,
            )
        )
    db.commit()


async def _translate_missing(items: list[str], direction: str) -> dict[str, str]:
    if not items:
        return {}

    target = "English" if direction == "th_to_en" else "Thai"
    prompt = (
        f"Translate the following list of items to {target}.\n"
        "Return a JSON object where the keys are the original input items, and the values are their translations.\n"
        "Return ONLY the raw JSON object, no markdown formatting, no explanations.\n"
        f"input: {json.dumps(items, ensure_ascii=False)}\n"
        'example output: {"ไข่": "egg", "หมู": "pork"}'
    )
    try:
        text = await generate_text(prompt)
        parsed = json.loads(_clean_json(text))
        return {item: str(parsed.get(item, item)).strip() for item in items}
    except Exception:
        return {item: item for item in items}


async def _translate_list(texts: Iterable[str], direction: str, db: Session | None = None) -> dict[str, str]:
    unique_texts = [text for text in dict.fromkeys(texts) if text]
    owns_db = db is None
    db = db or SessionLocal()
    try:
        result: dict[str, str] = {}
        missing: list[str] = []
        for text in unique_texts:
            cached = _get_cached(db, text, direction)
            if cached is None:
                missing.append(text)
            else:
                result[text] = cached

        translated = await _translate_missing(missing, direction)
        for source_text, translated_text in translated.items():
            result[source_text] = translated_text
            _save_cached(db, source_text, translated_text, direction)

        return result
    finally:
        if owns_db:
            db.close()


async def translate_to_en(thai_text: str, db: Session | None = None) -> str:
    return (await _translate_list([thai_text], "th_to_en", db)).get(thai_text, thai_text)


async def translate_list_to_en(thai_list: list[str], db: Session | None = None) -> dict[str, str]:
    return await _translate_list(thai_list, "th_to_en", db)


async def translate_to_th(english_text: str, db: Session | None = None) -> str:
    return (await _translate_list([english_text], "en_to_th", db)).get(english_text, english_text)


async def translate_list_to_th(english_list: list[str], db: Session | None = None) -> dict[str, str]:
    return await _translate_list(english_list, "en_to_th", db)
