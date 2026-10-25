/* Browser-only image rendering shared by the static guide and its embedded preview. */
(function () {
  const WIDTH = 1080, HEIGHT = 1350;
  const serif = '"Noto Serif CJK TC", "Songti TC", "PMingLiU", serif';
  const sans = '"Noto Sans CJK TC", "PingFang TC", "Microsoft JhengHei", sans-serif';

  function wrap(ctx, text, width) {
    const lines = [];
    for (const paragraph of String(text || '').split(/\r?\n/)) {
      let line = '';
      for (const char of Array.from(paragraph)) {
        if (line && ctx.measureText(line + char).width > width) {
          lines.push(line); line = char;
        } else line += char;
      }
      lines.push(line);
    }
    return lines;
  }

  function block(ctx, text, { x, y, width, height, size, family = serif, align = 'left', centered = false }) {
    let lines, lineHeight;
    do {
      ctx.font = `${size}px ${family}`;
      lines = wrap(ctx, text, width);
      lineHeight = size * 1.65;
      if (lines.length * lineHeight <= height || size <= 1) break;
      size -= 1;
    } while (size > 0);
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    const top = centered ? y + (height - lines.length * lineHeight) / 2 : y;
    lines.forEach((line, i) => ctx.fillText(line, x, top + i * lineHeight));
  }

  async function render(card) {
    if (document.fonts?.ready) await document.fonts.ready;
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH; canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('圖片繪製暫不可用');
    const css = getComputedStyle(document.documentElement);
    const color = name => css.getPropertyValue(name).trim();
    ctx.fillStyle = color('--paper'); ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = color('--line'); ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, WIDTH - 84, HEIGHT - 84);
    ctx.strokeRect(54, 54, WIDTH - 108, HEIGHT - 108);
    ctx.fillStyle = color('--bookshop'); ctx.fillRect(WIDTH / 2 - 6, 54, 12, 48);
    ctx.fillStyle = color('--muted-ink');
    block(ctx, '閱讀解憂籤 · 香港文化地圖', { x: WIDTH / 2, y: 122, width: 850, height: 50, size: 30, align: 'center', family: sans });
    block(ctx, card.type, { x: 105, y: 205, width: 420, height: 76, size: 26, family: sans });
    block(ctx, card.mood, { x: 975, y: 205, width: 360, height: 76, size: 26, align: 'right', family: sans });
    ctx.fillStyle = color('--ink');
    block(ctx, `「${card.content || ''}」`, { x: 120, y: 300, width: 840, height: 535, size: 54, centered: true });
    const signature = [card.signature || '', card.source_title ? `《${card.source_title}》` : ''].join('');
    ctx.fillStyle = color('--muted-ink');
    if (signature) block(ctx, `—— ${signature}`, { x: 960, y: 862, width: 840, height: 126, size: 30, align: 'right' });
    if (card.note) {
      ctx.strokeStyle = color('--line'); ctx.beginPath(); ctx.moveTo(120, 1010); ctx.lineTo(960, 1010); ctx.stroke();
      ctx.fillStyle = color('--ink');
      block(ctx, `伴讀小語：${card.note}`, { x: 120, y: 1034, width: 840, height: 140, size: 28 });
    }
    ctx.fillStyle = color('--bookshop');
    block(ctx, 'hkcultureguide.com', { x: WIDTH / 2, y: 1220, width: 850, height: 48, size: 28, family: sans, align: 'center' });
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('未能產生圖片')), 'image/png'));
  }

  function download(blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'hk-culture-reading-card.png';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  window.ReadingCardShare = { render, download };
})();