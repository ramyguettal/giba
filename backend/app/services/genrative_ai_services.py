from app.clients.ai_client import AIClient


class GenrativeAIServices:
    def __init__(self, client: AIClient | None = None):
        self.client = client or self.get_client()

    @classmethod
    def get_client(cls) -> AIClient:
        # TODO: If needed, branch here by provider and return the right client.
        return AIClient()

    def generate_text(self, prompt: str) -> str:
        # TODO: Use self.client to call the real AI provider here.
        # Example future providers: OpenAI, Anthropic, Groq, Gemini.
        raise NotImplementedError("AI provider is not configured yet.")
