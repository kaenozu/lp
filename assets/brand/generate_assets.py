"""Generate the portal favicon PNGs and Open Graph images with Pillow.

The script uses repository colors and a Japanese font already installed on the
local machine. Set LP_BRAND_FONT when the known platform font paths do not
match the environment.
"""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BRAND_DIR = Path(__file__).resolve().parent

COLOR_BG = (255, 250, 240)       # #fffaf0
COLOR_SURFACE = (255, 255, 255)  # #ffffff
COLOR_TEXT = (47, 42, 36)        # #2f2a24
COLOR_MUTED = (111, 103, 95)     # #6f675f
COLOR_PRIMARY = (246, 165, 49)   # #f6a531
COLOR_BORDER = (234, 223, 206)   # #eadfce

FONT_CANDIDATES = (
    Path("C:/Windows/Fonts/YuGothM.ttc"),
    Path("C:/Windows/Fonts/meiryo.ttc"),
    Path("/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc"),
    Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
    Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
)


def resolve_font_path() -> Path:
    configured = os.environ.get("LP_BRAND_FONT")
    candidates = (Path(configured),) + FONT_CANDIDATES if configured else FONT_CANDIDATES
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    raise RuntimeError(
        "Japanese font not found. Set LP_BRAND_FONT to a local Japanese font file."
    )


def draw_favicon_mark(
    draw: ImageDraw.ImageDraw,
    offset_x: int = 0,
    offset_y: int = 0,
    scale: float = 1.0,
) -> None:
    """Draw the two-card portal mark."""
    x1 = offset_x + int(120 * scale)
    y1 = offset_y + int(80 * scale)
    width = int(280 * scale)
    height = int(340 * scale)
    radius = max(int(40 * scale), 1)
    border_width = max(int(16 * scale), 1)
    draw.rounded_rectangle(
        [x1, y1, x1 + width, y1 + height],
        radius=radius,
        fill=COLOR_SURFACE,
        outline=COLOR_BORDER,
        width=border_width,
    )

    x2 = offset_x + int(90 * scale)
    y2 = offset_y + int(110 * scale)
    draw.rounded_rectangle(
        [x2, y2, x2 + width, y2 + height],
        radius=radius,
        fill=COLOR_PRIMARY,
    )

    line_height = max(int(16 * scale), 1)
    line_radius = max(int(8 * scale), 1)
    for index, (base_width, alpha) in enumerate(((160, 0.9), (120, 0.7), (140, 0.5))):
        line_y = offset_y + int((170 + index * 40) * scale)
        line_x = offset_x + int(130 * scale)
        line_width = int(base_width * scale)
        color = tuple(
            int(COLOR_SURFACE[channel] * alpha + COLOR_PRIMARY[channel] * (1 - alpha))
            for channel in range(3)
        )
        draw.rounded_rectangle(
            [line_x, line_y, line_x + line_width, line_y + line_height],
            radius=line_radius,
            fill=color,
        )


def generate_favicon_png(name: str, size: int) -> None:
    """Generate a transparent PNG favicon at the requested size."""
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_favicon_mark(ImageDraw.Draw(image), scale=size / 512)
    output = BRAND_DIR / name
    image.save(output, "PNG", optimize=True)
    print(f"{name}: {size}x{size}, {output.stat().st_size} bytes")


def generate_og_image(
    name: str,
    title: str,
    description: str,
    font_path: Path,
) -> None:
    """Generate an opaque 1200x630 Open Graph image."""
    width, height = 1200, 630
    image = Image.new("RGB", (width, height), COLOR_BG)
    draw = ImageDraw.Draw(image)

    mark_size = 260
    mark_x = width - mark_size - 80
    mark_y = (height - mark_size) // 2
    draw_favicon_mark(draw, offset_x=mark_x, offset_y=mark_y)

    title_font = ImageFont.truetype(str(font_path), 56)
    description_font = ImageFont.truetype(str(font_path), 26)

    text_x = 100
    y = 160
    for line in title.split("\n"):
        draw.text((text_x, y), line, fill=COLOR_TEXT, font=title_font)
        y += 72

    y += 20
    for line in description.split("\n"):
        draw.text((text_x, y), line, fill=COLOR_MUTED, font=description_font)
        y += 40

    output = BRAND_DIR / name
    image.save(output, "PNG", optimize=True)
    print(f"{name}: 1200x630, {output.stat().st_size} bytes")


def main() -> None:
    font_path = resolve_font_path()
    print(f"Japanese font: {font_path}")

    generate_favicon_png("favicon-32x32.png", 32)
    generate_favicon_png("favicon-16x16.png", 16)
    generate_favicon_png("apple-touch-icon.png", 180)

    generate_og_image(
        "og-portal.png",
        "小さなアプリ工房",
        "生活、学び、遊び、仕事。日々の中で思いついたアイデアを、\n小さなアプリとして形にしています。",
        font_path,
    )
    generate_og_image(
        "og-ashita-motsumono.png",
        "あしたもつもの",
        "学校・園・習い事の準備物や提出物を、\n前日にまとめて確認できるアプリ。",
        font_path,
    )
    generate_og_image(
        "og-ehenotane.png",
        "へぇの種",
        "4択クイズと短い解説で、\n知らなかったことに出会う雑学アプリ。",
        font_path,
    )


if __name__ == "__main__":
    main()
