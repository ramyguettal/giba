from __future__ import annotations

import json
import re

from app.clients.ai_client import AIClient, AIClientMessage
from app.core.config import settings
from app.core.exceptions import ValidationError

_REFORMULATE_SYSTEM = (
    "You are a senior maintenance engineer writing technical maintenance reports. "
    "Rewrite the provided maintenance report fields to be clear, technically precise, "
    "and professionally worded — suitable for a factory maintenance log. "
    "Preserve all factual content. Do not invent steps or causes not mentioned. "
    "Return ONLY valid JSON with keys: clean_problem, clean_cause, clean_solution."
)

_MODIFY_SYSTEM = (
    "You are editing a structured maintenance report. Apply the user instruction while "
    "preserving technical accuracy. Return ONLY valid JSON with keys: "
    "clean_problem, clean_cause, clean_solution."
)


class GenrativeAIServices:
    def __init__(self, client: AIClient | None = None):
        self._client = client
        self.enabled = client is not None or bool(settings.llm_api_key)

    @property
    def client(self) -> AIClient:
        if self._client is None:
            self._client = self.get_client()
        return self._client

    @classmethod
    def get_client(cls) -> AIClient:
        return AIClient()

    def generate_text(self, prompt: str, *, system: str | None = None, max_tokens: int = 800) -> str:
        messages = [
            AIClientMessage(role="system", content=system or "You are a helpful assistant."),
            AIClientMessage(role="user", content=prompt),
        ]
        return self.client.generate(messages, temperature=0.2, max_tokens=max_tokens)

    @staticmethod
    def _extract_json(text: str) -> dict:
        text = text.strip()
        try:
            return json.loads(text)
        except Exception:
            pass

        # Strip markdown code fences if present
        text = re.sub(r"```(?:json)?", "", text).strip()
        try:
            return json.loads(text)
        except Exception:
            pass

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass

        raise ValidationError("Model did not return valid JSON", details={"raw": text[:1000]})

    def reformulate_report(self, *, problem: str, cause: str, solution: str, locale: str | None = None) -> dict:
        prompt = (
            f"Locale: {locale or 'en'}\n"
            f"Problem: {problem}\n"
            f"Cause: {cause}\n"
            f"Solution: {solution}\n"
        )
        raw = self.generate_text(prompt, system=_REFORMULATE_SYSTEM, max_tokens=600)
        data = self._extract_json(raw)
        return {
            "clean_problem": str(data.get("clean_problem") or "").strip(),
            "clean_cause": str(data.get("clean_cause") or "").strip(),
            "clean_solution": str(data.get("clean_solution") or "").strip(),
        }

    def modify_reformulation(
        self,
        *,
        clean_problem: str,
        clean_cause: str,
        clean_solution: str,
        instruction: str,
        locale: str | None = None,
    ) -> dict:
        prompt = (
            f"Locale: {locale or 'en'}\n"
            f"Current clean_problem: {clean_problem}\n"
            f"Current clean_cause: {clean_cause}\n"
            f"Current clean_solution: {clean_solution}\n\n"
            f"Instruction: {instruction}\n"
        )
        raw = self.generate_text(prompt, system=_MODIFY_SYSTEM, max_tokens=600)
        data = self._extract_json(raw)
        return {
            "clean_problem": str(data.get("clean_problem") or "").strip(),
            "clean_cause": str(data.get("clean_cause") or "").strip(),
            "clean_solution": str(data.get("clean_solution") or "").strip(),
        }

    def generate_grounded_answer(
        self,
        *,
        query: str,
        retrieved_context: list[dict],
        locale: str | None = None,
    ) -> str:
        context_lines = []
        for item in retrieved_context:
            context_lines.append(
                f"[{item.get('chunk_id')}] ({item.get('source')} | {item.get('machine_type')})\n"
                f"{item.get('text')}\n"
            )
        context = "\n".join(context_lines)

        prompt = (
            f"Locale: {locale or 'en'}\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}"
        )
        from app.clients.ai_client import AIClientMessage
        from app.services.chat_service import _SYSTEM_PROMPT
        messages = [
            AIClientMessage(role="system", content=_SYSTEM_PROMPT),
            AIClientMessage(role="user", content=prompt),
        ]
        return self.client.generate(messages, temperature=0.15, max_tokens=1500).strip()
