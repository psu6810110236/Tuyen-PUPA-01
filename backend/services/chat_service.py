from sqlalchemy.orm import Session

from models.chat import ChatHistory


def save_message(user_id: int, role: str, content: str, db: Session) -> ChatHistory:
    message = ChatHistory(user_id=user_id, role=role, content=content)
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_history(user_id: int, limit: int, db: Session) -> list[ChatHistory]:
    return (
        db.query(ChatHistory)
        .filter(ChatHistory.user_id == user_id)
        .order_by(ChatHistory.created_at.desc())
        .limit(limit)
        .all()
    )[::-1]


def clear_history(user_id: int, db: Session) -> bool:
    rows = db.query(ChatHistory).filter(ChatHistory.user_id == user_id).all()
    for row in rows:
        db.delete(row)
    db.commit()
    return True
