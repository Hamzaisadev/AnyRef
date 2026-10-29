# AI Provider Abstraction Interface

All model interactions are isolated behind a single TypeScript `AiProvider` interface with strict Zod structured outputs, separating business logic from Google Gemini and Anthropic Claude SDK specifics. Because model capabilities, token costs, and vision quality fluctuate rapidly between providers, coupling the core generation service to a single vendor risks lock-in. A unified interface allows swapping providers or routing specific prompts between Gemini and Claude via configuration alone.
