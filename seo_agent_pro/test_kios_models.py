#!/usr/bin/env python3
"""Safely probe KiosAPI models from CI.

The script never prints the API key or model output. It reports only whether a
model is accessible, its HTTP status, latency, and a sanitized error summary.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from typing import Any

DEFAULT_BASE = "https://kiosapi.com/v1"
DEFAULT_MODELS = [
    "gpt-4o-mini",
    "gemini-2.5-flash",
    "claude-3-5-haiku-20241022",
    "deepseek-chat",
    "qwen2.5-72b-instruct",
    "llama-3.3-70b-instruct",
]


def request_json(url: str, api_key: str, method: str = "GET", payload: dict[str, Any] | None = None) -> tuple[int, dict[str, Any]]:
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "AIPrintVerse-KiosAPI-model-probe/1.0",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=45) as response:
            raw = response.read().decode("utf-8", errors="replace")
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            data = {"error": raw[:300]}
        return exc.code, data


def error_summary(data: dict[str, Any]) -> str:
    text = json.dumps(data, ensure_ascii=False)
    text = re.sub(r"sk-[A-Za-z0-9_-]+", "[REDACTED]", text)
    text = re.sub(r"Bearer\s+\S+", "Bearer [REDACTED]", text, flags=re.I)
    return text[:240]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", default=",".join(DEFAULT_MODELS), help="Comma-separated model IDs to probe")
    parser.add_argument("--prompt", default="Reply with exactly: OK", help="Small non-content test prompt")
    parser.add_argument("--output", default="kios-model-results.json")
    args = parser.parse_args()

    api_key = os.getenv("KIOS_API_KEY", "").strip()
    base_url = os.getenv("KIOS_API_BASE", DEFAULT_BASE).rstrip("/")
    if not api_key:
        print("KIOS_API_KEY is not set", file=sys.stderr)
        return 2

    model_status, model_payload = request_json(f"{base_url}/models", api_key)
    accessible = {
        str(item.get("id"))
        for item in model_payload.get("data", [])
        if isinstance(item, dict) and item.get("id")
    }
    requested = [item.strip() for item in args.models.split(",") if item.strip()]
    if accessible:
        selected = [model for model in requested if model in accessible]
        skipped = [model for model in requested if model not in accessible]
    else:
        selected, skipped = requested, []

    print(f"models_endpoint_status={model_status}")
    print(f"accessible_models={len(accessible)}")
    print(f"selected_models={len(selected)}")
    if skipped:
        print("skipped_not_listed=" + ",".join(skipped))

    results: list[dict[str, Any]] = []
    for model in selected:
        started = time.perf_counter()
        status, payload = request_json(
            f"{base_url}/chat/completions",
            api_key,
            method="POST",
            payload={
                "model": model,
                "messages": [{"role": "user", "content": args.prompt}],
                "max_tokens": 8,
                "temperature": 0,
            },
        )
        latency_ms = round((time.perf_counter() - started) * 1000)
        ok = status == 200 and bool(payload.get("choices"))
        result = {"model": model, "ok": ok, "status": status, "latency_ms": latency_ms}
        if not ok:
            result["error"] = error_summary(payload)
        results.append(result)
        print(f"{'PASS' if ok else 'FAIL'} model={model} status={status} latency_ms={latency_ms}")
        if not ok:
            print(f"  error={result['error']}")

    summary = {
        "base_url": base_url,
        "models_endpoint_status": model_status,
        "accessible_model_count": len(accessible),
        "requested_models": requested,
        "skipped_not_listed": skipped,
        "results": results,
    }
    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(summary, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return 0 if any(item["ok"] for item in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
