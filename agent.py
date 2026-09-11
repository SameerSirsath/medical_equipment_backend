import os
import time
import httpx
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# ── Configuration ──────────────────────────────────────────────
PRIMARY_PROVIDER = os.getenv("PRIMARY_PROVIDER", "groq").lower()

DUMMY_KEY_PATTERNS = {
    "custom_key", "your-custom-api-key", "your-groq-api-key",
    "your-mistral-api-key", "your-openrouter-api-key", "your-gemini-api-key"
}

def is_valid_key(key: str) -> bool:
    if not key or not key.strip():
        return False
    k = key.strip().lower()
    return k not in DUMMY_KEY_PATTERNS and not k.startswith("your-")

# ── Provider: Groq ─────────────────────────────────────────────
GROQ_KEYS = os.getenv("GROQ_API_KEYS", "")
if not GROQ_KEYS:
    single_key = os.getenv("GROQ_API_KEY")
    groq_keys = [single_key] if single_key else []
else:
    groq_keys = [k.strip() for k in GROQ_KEYS.split(",") if is_valid_key(k)]
groq_keys = [k for k in groq_keys if is_valid_key(k)]

GROQ_MODELS = [m.strip() for m in os.getenv("GROQ_MODELS", "groq/compound-mini,qwen/qwen3.8-27b,llama-3.1-8b-instant,mixtral-8x7b-32768").split(",") if m.strip()]
# Guarantee active Groq models are available in the fallback list
for fallback_m in ["groq/compound-mini", "qwen/qwen3.8-27b", "groq/compound"]:
    if fallback_m not in GROQ_MODELS:
        GROQ_MODELS.append(fallback_m)

# ── Provider: Mistral AI ──────────────────────────────────────
MISTRAL_KEYS = os.getenv("MISTRAL_API_KEYS", "")
if not MISTRAL_KEYS:
    single_key = os.getenv("MISTRAL_API_KEY")
    mistral_keys = [single_key] if single_key else []
else:
    mistral_keys = [k.strip() for k in MISTRAL_KEYS.split(",") if is_valid_key(k)]
mistral_keys = [k for k in mistral_keys if is_valid_key(k)]

# Free tier models: mistral-tiny, mistral-small, mistral-medium
MISTRAL_MODELS = os.getenv("MISTRAL_MODELS", "mistral-small-latest,mistral-medium-latest").split(",")
MISTRAL_MODELS = [m.strip() for m in MISTRAL_MODELS if m.strip()]

# ── Provider: OpenRouter ──────────────────────────────────────
OPENROUTER_KEYS = os.getenv("OPENROUTER_API_KEYS", "")
if not OPENROUTER_KEYS:
    single_key = os.getenv("OPENROUTER_API_KEY")
    openrouter_keys = [single_key] if single_key else []
else:
    openrouter_keys = [k.strip() for k in OPENROUTER_KEYS.split(",") if is_valid_key(k)]
openrouter_keys = [k for k in openrouter_keys if is_valid_key(k)]

OPENROUTER_MODELS = os.getenv("OPENROUTER_MODELS",
    "mistralai/mistral-7b-instruct:free,mistralai/mistral-7b-instruct,google/gemma-2-9b-it:free"
).split(",")
OPENROUTER_MODELS = [m.strip() for m in OPENROUTER_MODELS if m.strip()]

# ── Provider: Custom ────────────────────────────────────────────
CUSTOM_KEYS = os.getenv("CUSTOM_API_KEYS", "")
if not CUSTOM_KEYS:
    single_key = os.getenv("CUSTOM_API_KEY")
    custom_keys = [single_key] if single_key else []
else:
    custom_keys = [k.strip() for k in CUSTOM_KEYS.split(",") if is_valid_key(k)]
custom_keys = [k for k in custom_keys if is_valid_key(k)]

CUSTOM_MODELS = os.getenv("CUSTOM_MODELS", "gpt-3.5-turbo").split(",")
CUSTOM_MODELS = [m.strip() for m in CUSTOM_MODELS if m.strip()]
CUSTOM_BASE_URL = os.getenv("CUSTOM_BASE_URL", "https://api.openai.com/v1")

# ── Provider: Gemini (Google) ─────────────────────────────────
GEMINI_KEYS = os.getenv("GEMINI_API_KEYS", "")
if not GEMINI_KEYS:
    single_key = os.getenv("GEMINI_API_KEY")
    gemini_keys = [single_key] if single_key else []
else:
    gemini_keys = [k.strip() for k in GEMINI_KEYS.split(",") if k.strip()]

GEMINI_MODELS = os.getenv("GEMINI_MODELS", "gemini-1.5-flash,gemini-1.5-pro").split(",")
GEMINI_MODELS = [m.strip() for m in GEMINI_MODELS if m.strip()]

# ── Build the provider chain ──────────────────────────────────
PROVIDER_CHAIN = []

if gemini_keys:
    PROVIDER_CHAIN.append({
        'name': 'gemini',
        'keys': gemini_keys,
        'models': GEMINI_MODELS,
        'base_url': None
    })

if groq_keys:
    PROVIDER_CHAIN.append({
        'name': 'groq',
        'keys': groq_keys,
        'models': GROQ_MODELS,
        'base_url': "https://api.groq.com/openai/v1"
    })

if mistral_keys:
    PROVIDER_CHAIN.append({
        'name': 'mistral',
        'keys': mistral_keys,
        'models': MISTRAL_MODELS,
        'base_url': "https://api.mistral.ai/v1"
    })

if openrouter_keys:
    PROVIDER_CHAIN.append({
        'name': 'openrouter',
        'keys': openrouter_keys,
        'models': OPENROUTER_MODELS,
        'base_url': "https://openrouter.ai/api/v1"
    })

if custom_keys:
    PROVIDER_CHAIN.append({
        'name': 'custom',
        'keys': custom_keys,
        'models': CUSTOM_MODELS,
        'base_url': CUSTOM_BASE_URL
    })

# Reorder: move the primary provider to the front
for i, provider in enumerate(PROVIDER_CHAIN):
    if provider['name'] == PRIMARY_PROVIDER:
        PROVIDER_CHAIN.insert(0, PROVIDER_CHAIN.pop(i))
        break

# ── Helper: call OpenAI‑compatible API with fixed HTTP client ──
def call_openai_compatible(prompt, model, temperature, max_tokens, api_key, base_url):
    http_client = httpx.Client()
    client = OpenAI(
        api_key=api_key,
        base_url=base_url,
        http_client=http_client,
    )
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()

# ── Helper: call Google Gemini API ────────────────────────────
def call_gemini(prompt, model, temperature, max_tokens, api_key):
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    generation_config = genai.types.GenerationConfig(
        temperature=temperature,
        max_output_tokens=max_tokens,
    )
    gemini_model = genai.GenerativeModel(model_name=model)
    response = gemini_model.generate_content(prompt, generation_config=generation_config)
    return response.text.strip()

# ── Main generation function ──────────────────────────────────
def generate_text(
    prompt: str,
    model: str = None,
    temperature: float = 0.1,
    max_tokens: int = 400,
) -> str:
    last_error = None

    for provider in PROVIDER_CHAIN:
        name = provider['name']
        keys = provider['keys']
        models = provider['models']
        base_url = provider['base_url']

        if model and model in models:
            models = [model] + [m for m in models if m != model]

        for api_key in keys:
            for current_model in models:
                try:
                    if name == 'gemini':
                        result = call_gemini(
                            prompt, current_model, temperature, max_tokens, api_key
                        )
                    else:
                        result = call_openai_compatible(
                            prompt, current_model, temperature, max_tokens, api_key, base_url
                        )
                    return result
                except Exception as e:
                    last_error = e
                    print(f"⚠️ Provider {name} (model {current_model}) failed: {e}")
                    continue

    raise Exception(f"All providers exhausted. Last error: {last_error}")

# ── Wrapper for app.py ─────────────────────────────────────────
def ask_agent(enhanced_prompt: str, model: str = None, max_tokens: int = 400) -> str:
    try:
        return generate_text(enhanced_prompt, model, max_tokens=max_tokens)
    except Exception as e:
        return f"❌ I'm having trouble processing your request. Error: {str(e)}"

# ── Quick Test ──────────────────────────────────────────────────
if __name__ == "__main__":
    test_prompt = "Hello! Please respond with exactly 'OK' and nothing else."
    try:
        response = generate_text(test_prompt, temperature=0.0, max_tokens=10)
        print("✅ Connected and responding:", response)
    except Exception as e:
        print("❌ Failed:", e)
        print("Check your .env file for API keys.")