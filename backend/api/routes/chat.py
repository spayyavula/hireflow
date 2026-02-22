from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from api.core.config import require_user
from api.core.database import (
    get_user_by_id,
    get_conversation_between,
    create_conversation,
    get_conversations_for_user,
    get_messages,
    get_conversation_participants,
    create_message,
    mark_messages_read,
)
from api.models.schemas import (
    MessageSend,
    MessageResponse,
    ConversationResponse,
)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(user: dict = Depends(require_user)):
    """List all conversations for the current user."""
    convs = get_conversations_for_user(user["id"])
    return [ConversationResponse(**c) for c in convs]


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageResponse])
async def get_conv_messages(conv_id: str, user: dict = Depends(require_user)):
    """Get all messages in a conversation."""
    participants = get_conversation_participants(conv_id)
    if not participants:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if user["id"] not in participants:
        raise HTTPException(status_code=403, detail="Not a participant")

    # Mark as read
    mark_messages_read(conv_id, user["id"])

    msgs = get_messages(conv_id)
    return [
        MessageResponse(
            id=m["id"],
            conversation_id=conv_id,
            sender_id=m["sender_id"],
            sender_name=(get_user_by_id(m["sender_id"]) or {}).get("name", "Unknown"),
            content=m["content"],
            read=m.get("read", False),
            created_at=m.get("created_at", ""),
        )
        for m in msgs
    ]


@router.post("/messages", response_model=MessageResponse, status_code=201)
async def send_message(req: MessageSend, user: dict = Depends(require_user)):
    """Send a message to another user."""
    recipient = get_user_by_id(req.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Find or create conversation
    conv_id = get_conversation_between(user["id"], req.recipient_id)
    if not conv_id:
        conv_id = f"conv_{uuid4().hex[:12]}"
        create_conversation(conv_id, [user["id"], req.recipient_id])

    msg_id = f"msg_{uuid4().hex[:12]}"
    msg = create_message({
        "id": msg_id,
        "conversation_id": conv_id,
        "sender_id": user["id"],
        "content": req.content,
        "read": False,
    })

    return MessageResponse(
        id=msg_id,
        conversation_id=conv_id,
        sender_id=user["id"],
        sender_name=user.get("name", "Unknown"),
        content=req.content,
        read=False,
        created_at=msg.get("created_at", ""),
    )
