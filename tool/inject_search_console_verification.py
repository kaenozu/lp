from __future__ import annotations

import os
import re
import sys
from pathlib import Path

META_PATTERN = re.compile(
    r"\n?\s*<meta\s+name=[\"']google-site-verification[\"']\s+content=[\"'][^\"']*[\"']\s*/?>",
    re.IGNORECASE,
)
TOKEN_PATTERN = re.compile(r"[A-Za-z0-9_-]{8,200}")


def inject(path: Path, token: str) -> bool:
    text = path.read_text(encoding="utf-8")
    text = META_PATTERN.sub("", text)
    token = token.strip()
    if not token:
        path.write_text(text, encoding="utf-8")
        return False
    if TOKEN_PATTERN.fullmatch(token) is None:
        raise ValueError("SEARCH_CONSOLE_VERIFICATION contains unsupported characters or length")
    marker = "</head>"
    if text.count(marker) != 1:
        raise ValueError(f"expected exactly one {marker} in {path}")
    meta = f'  <meta name="google-site-verification" content="{token}">\n'
    path.write_text(text.replace(marker, meta + marker), encoding="utf-8")
    return True


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "_site/index.html")
    token = os.environ.get("SEARCH_CONSOLE_VERIFICATION", "")
    if inject(path, token):
        print("Injected Search Console verification metadata")
    else:
        print("Search Console verification metadata is not configured")


if __name__ == "__main__":
    main()
