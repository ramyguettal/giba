from __future__ import annotations

from dataclasses import dataclass

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.core.config import settings
from app.core.exceptions import ValidationError


@dataclass(frozen=True)
class AIClientMessage:
    role: str
    content: str


class AIClient:
    def __init__(self, *, api_key: str | None = None, model: str | None = None, base_url: str | None = None):
        api_key = api_key if api_key is not None else settings.llm_api_key
        model = model if model is not None else settings.llm_model
        base_url = base_url if base_url is not None else settings.llm_base_url
        if not api_key:
            raise ValidationError("No LLM API key configured (set OPENROUTER_API_KEY in .env)")

        self.model_name = model
        self.client = ChatOpenAI(
            api_key=api_key,
            base_url=base_url,
            model=model,
            default_headers={
                "HTTP-Referer": "https://giba.ai",
                "X-Title": "GIBA Maintenance Assistant",
            },
        )

    def generate(
        self,
        messages: list[AIClientMessage],
        *,
        temperature: float = 0.2,
        max_tokens: int = 1200,
    ) -> str:
        lc_messages = []
        for msg in messages:
            role = msg.role.lower()
            if role == "system":
                lc_messages.append(SystemMessage(content=msg.content))
            elif role in ("user", "human"):
                lc_messages.append(HumanMessage(content=msg.content))
            elif role in ("assistant", "ai"):
                lc_messages.append(AIMessage(content=msg.content))
            else:
                raise ValidationError(f"Unsupported message role: {msg.role}")

        bound = self.client.bind(temperature=temperature, max_tokens=max_tokens)
        result = bound.invoke(lc_messages)
        return str(getattr(result, "content", "") or "")
