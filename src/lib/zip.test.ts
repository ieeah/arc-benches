import { describe, it, expect } from 'vitest';
import { createZip, crc32 } from './zip';

const enc = new TextEncoder();
const dec = new TextDecoder();

describe('crc32', () => {
  it('matches the reference value for "123456789"', () => {
    expect(crc32(enc.encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('createZip', () => {
  it('writes readable entries with folder paths and UTF-8 content', () => {
    const files = [
      { path: 'src/data/a.json', content: '{"a":1}\n' },
      { path: 'src/i18n/locales/it.ts', content: 'export const it = { "x": "perché" };\n' },
    ];
    const zip = createZip(files, new Date(2026, 9, 9, 12, 0, 0));
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

    // end of central directory: signature, entry count, central dir offset
    const eocd = zip.length - 22;
    expect(view.getUint32(eocd, true)).toBe(0x06054b50);
    expect(view.getUint16(eocd + 10, true)).toBe(2);

    // walk the central directory and read each entry back through its local header
    let pos = view.getUint32(eocd + 16, true);
    const read: Record<string, string> = {};
    for (let i = 0; i < 2; i++) {
      expect(view.getUint32(pos, true)).toBe(0x02014b50);
      const crc = view.getUint32(pos + 16, true);
      const size = view.getUint32(pos + 24, true);
      const nameLen = view.getUint16(pos + 28, true);
      const local = view.getUint32(pos + 42, true);
      const name = dec.decode(zip.slice(pos + 46, pos + 46 + nameLen));
      expect(view.getUint32(local, true)).toBe(0x04034b50);
      const dataStart = local + 30 + view.getUint16(local + 26, true);
      const data = zip.slice(dataStart, dataStart + size);
      expect(crc32(data)).toBe(crc);
      read[name] = dec.decode(data);
      pos += 46 + nameLen;
    }
    expect(read).toEqual({
      'src/data/a.json': files[0].content,
      'src/i18n/locales/it.ts': files[1].content,
    });
  });

  it('produces a valid empty archive', () => {
    const zip = createZip([]);
    expect(zip.length).toBe(22);
  });
});
