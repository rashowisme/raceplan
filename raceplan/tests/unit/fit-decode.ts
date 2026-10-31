/**
 * Independent FIT reader for tests: checks both CRCs (CRC-16/ARC, the FIT
 * checksum) and returns every data message with its raw field values.
 */
export interface FitMessage {
  global: number;
  fields: Record<number, number | string>;
}

function crc16arc(bytes: Uint8Array, end: number): number {
  let crc = 0;
  for (let i = 0; i < end; i++) {
    crc ^= bytes[i]!;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
  }
  return crc;
}

export function decodeFit(bytes: Uint8Array): FitMessage[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const headerSize = bytes[0]!;
  if (headerSize !== 14) throw new Error("header size");
  if (new TextDecoder().decode(bytes.slice(8, 12)) !== ".FIT") throw new Error("signature");
  if (view.getUint16(12, true) !== crc16arc(bytes, 12)) throw new Error("header crc");
  const dataSize = view.getUint32(4, true);
  const end = headerSize + dataSize;
  if (bytes.length !== end + 2) throw new Error("length");
  if (view.getUint16(end, true) !== crc16arc(bytes, end)) throw new Error("file crc");

  const defs = new Map<number, { global: number; fields: [number, number, number][] }>();
  const out: FitMessage[] = [];
  let pos = headerSize;
  while (pos < end) {
    const h = bytes[pos++]!;
    if (h & 0x80) throw new Error("compressed timestamps are not expected");
    const local = h & 0x0f;
    if (h & 0x40) {
      if (bytes[pos + 1] !== 0) throw new Error("big-endian not expected");
      const global = view.getUint16(pos + 2, true);
      const n = bytes[pos + 4]!;
      pos += 5;
      const fields: [number, number, number][] = [];
      for (let i = 0; i < n; i++, pos += 3)
        fields.push([bytes[pos]!, bytes[pos + 1]!, bytes[pos + 2]!]);
      defs.set(local, { global, fields });
      continue;
    }
    const def = defs.get(local);
    if (!def) throw new Error("data before definition");
    const msg: FitMessage = { global: def.global, fields: {} };
    for (const [num, size, base] of def.fields) {
      if (base === 0x07) {
        const raw = bytes.slice(pos, pos + size);
        const zero = raw.indexOf(0);
        if (zero < 0) throw new Error("unterminated string");
        msg.fields[num] = new TextDecoder("utf-8", { fatal: true }).decode(raw.slice(0, zero));
      } else if (size === 1) msg.fields[num] = bytes[pos]!;
      else if (size === 2) msg.fields[num] = view.getUint16(pos, true);
      else if (size === 4) msg.fields[num] = view.getUint32(pos, true);
      else throw new Error(`unexpected size ${size}`);
      pos += size;
    }
    out.push(msg);
  }
  return out;
}
