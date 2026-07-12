"""
C:\gemini-desktop\LP\assets\brand\generate_assets.py
favicon PNG版とOGP画像を Pillow で決定論的に生成する
外部素材・フォントダウンロードなし。ローカル環境の日本語フォントを使用
関連: assets/brand/favicon.svg, index.html, apps/*/index.html
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# ===== 定数 =====
BRAND_DIR = Path(__file__).parent
ASSETS_DIR = BRAND_DIR.parent
ROOT_DIR = ASSETS_DIR.parent

# カラー（assets/styles.css の CSS 変数から抽出）
COLOR_BG = (255, 250, 240)       # #fffaf0
COLOR_SURFACE = (255, 255, 255)  # #ffffff
COLOR_TEXT = (47, 42, 36)        # #2f2a24
COLOR_MUTED = (111, 103, 95)     # #6f675f
COLOR_PRIMARY = (246, 165, 49)   # #f6a531
COLOR_BORDER = (234, 223, 206)   # #eadfce

# フォント
FONT_PATH = "C:/Windows/Fonts/YuGothM.ttc"


def draw_favicon_mark(draw: ImageDraw.ImageDraw, size: int, offset_x: int = 0, offset_y: int = 0, scale: float = 1.0):
    """
    favicon の幾何学マーク（2枚の重なるカード）を描画する
    後ろのカード: 白＋ボーダー、前のカード: オレンジ＋白い線
    """
    s = scale
    ox, oy = offset_x, offset_y

    # 後ろのカード（白、ボーダー付き）
    x1, y1 = ox + int(120 * s), oy + int(80 * s)
    w, h = int(280 * s), int(340 * s)
    r = int(40 * s)
    bw = max(int(16 * s), 1)
    draw.rounded_rectangle([x1, y1, x1 + w, y1 + h], radius=r,
                           fill=COLOR_SURFACE, outline=COLOR_BORDER, width=bw)

    # 前のカード（オレンジ）
    x2, y2 = ox + int(90 * s), oy + int(110 * s)
    draw.rounded_rectangle([x2, y2, x2 + w, y2 + h], radius=r,
                           fill=COLOR_PRIMARY)

    # 前カード上の白い横線（テキスト行を示す）
    line_h = max(int(16 * s), 1)
    lr = max(int(8 * s), 1)
    lines = [
        (int(160 * s), 0.9),
        (int(120 * s), 0.7),
        (int(140 * s), 0.5),
    ]
    for i, (lw, alpha) in enumerate(lines):
        ly = oy + int((170 + i * 40) * s)
        lx = ox + int(130 * s)
        # alpha sim via lighter color
        c = tuple(int(COLOR_SURFACE[k] * alpha + COLOR_PRIMARY[k] * (1 - alpha)) for k in range(3))
        draw.rounded_rectangle([lx, ly, lx + lw, ly + line_h], radius=lr, fill=c)


def generate_favicon_png(name: str, size: int):
    """指定サイズのfavicon PNGを生成する"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_favicon_mark(draw, size)
    out = BRAND_DIR / name
    img.save(out, "PNG")
    print(f"  {name}: {size}x{size}, {out.stat().st_size} bytes")


def generate_og_image(name: str, title: str, desc: str):
    """
    OGP画像（1200x630）を生成する
    左にタイトル＋説明、右にfaviconマークの装飾
    """
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), COLOR_BG)
    draw = ImageDraw.Draw(img)

    # 右側にfaviconマーク（装飾的）
    mark_size = 260
    mark_x = W - mark_size - 80
    mark_y = (H - mark_size) // 2
    draw_favicon_mark(draw, mark_size, mark_x, mark_y)

    # 左側にテキスト
    try:
        font_title = ImageFont.truetype(FONT_PATH, 56)
        font_desc = ImageFont.truetype(FONT_PATH, 26)
    except Exception:
        font_title = ImageFont.load_default()
        font_desc = ImageFont.load_default()

    text_x = 100
    text_max_w = W - mark_size - 200

    # タイトル（複数行対応）
    title_lines = []
    for line in title.split("\n"):
        title_lines.append(line)

    y = 160
    for line in title_lines:
        draw.text((text_x, y), line, fill=COLOR_TEXT, font=font_title)
        y += 72

    # 説明（複数行対応）
    y += 20
    for line in desc.split("\n"):
        draw.text((text_x, y), line, fill=COLOR_MUTED, font=font_desc)
        y += 40

    out = BRAND_DIR / name
    img.save(out, "PNG", optimize=True)
    print(f"  {name}: 1200x630, {out.stat().st_size} bytes")


def main():
    print("=== favicon PNG 生成 ===")
    generate_favicon_png("favicon-32x32.png", 32)
    generate_favicon_png("favicon-16x16.png", 16)
    generate_favicon_png("apple-touch-icon.png", 180)

    print("\n=== OGP画像 生成 ===")
    # ルートページ
    generate_og_image(
        "og-portal.png",
        "小さなアプリ工房",
        "生活、学び、遊び、仕事。日々の中で思いついたアイデアを、\n小さなアプリとして形にしています。",
    )
    # あしたもつもの
    generate_og_image(
        "og-ashita-motsumono.png",
        "あしたもつもの",
        "学校・園・習い事の準備物や提出物を、\n前日にまとめて確認できるアプリ。",
    )
    # へぇの種
    generate_og_image(
        "og-ehenotane.png",
        "へぇの種",
        "4択クイズと短い解説で、\n知らなかったことに出会う雑学アプリ。",
    )

    print("\n完了")


if __name__ == "__main__":
    main()
