from __future__ import annotations

import json
import re

from app.clients.ai_client import AIClient, AIClientMessage
from app.core.exceptions import ValidationError


class GenrativeAIServices:
    def __init__(self, client: AIClient | None = None):
        self.client = client or self.get_client()

    @classmethod
    def get_client(cls) -> AIClient:
        return AIClient()

    def generate_text(self, prompt: str) -> str:
        return self.client.generate(
            [AIClientMessage(role="system", content="You are a helpful assistant."), AIClientMessage(role="user", content=prompt)],
            temperature=0.2,
            max_tokens=800,
        )

    @staticmethod
    def _extract_json(text: str) -> dict:
        text = text.strip()
        # Try direct JSON
        try:
            return json.loads(text)
        except Exception:
            pass

        # Try to find the first JSON object
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except Exception:
                pass

        raise ValidationError("Model did not return valid JSON", details={"raw": text[:1000]})

    def reformulate_report(self, *, problem: str, cause: str, solution: str, locale: str | None = None) -> dict:
        prompt = (
            "You are an expert maintenance assistant. Rewrite the following structured fields clearly and professionally "
            "WITHOUT changing meaning. Return ONLY valid JSON with keys: clean_problem, clean_cause, clean_solution.\n\n"
            f"Locale: {locale or 'default'}\n"
            f"Problem: {problem}\nCause: {cause}\nSolution: {solution}\n"
        )
        raw = self.generate_text(prompt)
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
            "You are an expert maintenance assistant. You are given a structured report and a user instruction. "
            "Apply the instruction while preserving technical correctness. Return ONLY valid JSON with keys: "
            "clean_problem, clean_cause, clean_solution.\n\n"
            f"Locale: {locale or 'default'}\n"
            f"Current clean_problem: {clean_problem}\n"
            f"Current clean_cause: {clean_cause}\n"
            f"Current clean_solution: {clean_solution}\n\n"
            f"User instruction: {instruction}\n"
        )
        raw = self.generate_text(prompt)
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
                f"- id={item.get('chunk_id')} machine_type={item.get('machine_type')} source={item.get('source')}\n"
                f"  text={item.get('text')}\n"
            )
        context = "\n".join(context_lines)

        prompt = (
            "You are a maintenance assistant. Answer the user using ONLY the provided context when making factual claims. "
            "If context is insufficient, ask a clarifying question. Mention relevant chunk ids like [id].\n\n"
            f"Locale: {locale or 'default'}\n"
            f"User question: {query}\n\n"
            f"Context chunks:\n{context}\n"
        )
        return self.generate_text(prompt).strip()
