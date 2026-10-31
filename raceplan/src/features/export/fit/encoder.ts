/**
 * Minimal FIT (Flexible and Interoperable Data Transfer) file writer: just
 * enough of the public FIT protocol to write workout files. Little-endian,
 * no compressed timestamps, no developer fields.
 */

/** FIT base types used by workout files. */
export const BASE = {
  enum: { id: 0x00, size: 1, invalid: 0xff },
  uint8: { id: 0x02, size: 1, invalid: 0xff },
  uint16: { id: 0x84, size: 2, invalid: 0xffff },
  uint32: { id: 0x86, size: 4, invalid: 0xffffffff },
  uint32z: { id: 0x8c, size: 4, invalid: 0 },
  string: { id: 0x07, size: 0, invalid: 0 },
} as const;
export type BaseType = keyof typeof BASE;

export interface Field {
  /** Field definition number from the FIT profile. */
  num: number;
  type: BaseType;
  /** Numbers for numeric types; strings are UTF-8, null-terminated. */
  value: number | string;
}

/** Protocol 2.0, profile 21.40. */
const PROTOCOL_VERSION = 0x20;
const PROFILE_VERSION = 2140;
const HEADER_SIZE = 14;

/** Seconds between the Unix epoch and the FIT epoch (1989-12-31T00:00:00Z). */
export const FIT_EPOCH_OFFSET_S = 631_065_600;

const CRC_TABLE = [
  0x0000, 0xcc01, 0xd801, 0x1400, 0xf001, 0x3c00, 0x2800, 0xe401, 0xa001, 0x6c00, 0x7800, 0xb401,
  0x5000, 0x9c01, 0x8801, 0x4400,
];

/** FIT CRC-16 (the protocol's nibble-table variant). */
export function fitCrc(bytes: Uint8Array, start = 0, end = bytes.length): number {
  let crc = 0;
  for (let i = start; i < end; i++) {
    const b = bytes[i]!;
    let tmp = CRC_TABLE[crc & 0xf]!;
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[b & 0xf]!;
    tmp = CRC_TABLE[crc & 0xf]!;
    crc = (crc >> 4) & 0x0fff;
    crc = crc ^ tmp ^ CRC_TABLE[(b >> 4) & 0xf]!;
  }
  return crc;
}

/** UTF-8 bytes + null terminator, cut at a character boundary to fit `maxBytes`. */
export function encodeString(s: string, maxBytes: number): Uint8Array {
  const enc = new TextEncoder();
  let bytes = enc.encode(s);
  if (bytes.length > maxBytes - 1) {
    let cut = maxBytes - 1;
    // Back up over UTF-8 continuation bytes (10xxxxxx).
    while (cut > 0 && (bytes[cut]! & 0xc0) === 0x80) cut--;
    bytes = bytes.slice(0, cut);
  }
  const out = new Uint8Array(bytes.length + 1);
  out.set(bytes);
  return out;
}

/** Longest string field written (bytes, including the terminator). */
export const MAX_STRING_BYTES = 64;

/**
 * Accumulates messages and produces a complete `.fit` file. Each message
 * reuses local message type 0 and is preceded by its definition whenever
 * the layout changes (string lengths vary), which every reader supports.
 */
export class FitWriter {
  private chunks: number[] = [];
  private lastLayout = "";

  write(globalNum: number, fields: readonly Field[]): void {
    const encoded = fields.map((f) => ({ ...f, bytes: encodeField(f) }));
    const layout = `${globalNum}:${encoded.map((f) => `${f.num}/${f.type}/${f.bytes.length}`).join(",")}`;
    if (layout !== this.lastLayout) {
      this.lastLayout = layout;
      this.chunks.push(0x40, 0, 0, globalNum & 0xff, globalNum >> 8, encoded.length);
      for (const f of encoded) this.chunks.push(f.num, f.bytes.length, BASE[f.type].id);
    }
    this.chunks.push(0x00);
    for (const f of encoded) this.chunks.push(...f.bytes);
  }

  /** The finished file: header (with CRC), records, file CRC. */
  bytes(): Uint8Array {
    const dataSize = this.chunks.length;
    const out = new Uint8Array(HEADER_SIZE + dataSize + 2);
    const view = new DataView(out.buffer);
    out[0] = HEADER_SIZE;
    out[1] = PROTOCOL_VERSION;
    view.setUint16(2, PROFILE_VERSION, true);
    view.setUint32(4, dataSize, true);
    out.set([0x2e, 0x46, 0x49, 0x54], 8); // ".FIT"
    view.setUint16(12, fitCrc(out, 0, 12), true);
    out.set(this.chunks, HEADER_SIZE);
    view.setUint16(HEADER_SIZE + dataSize, fitCrc(out, 0, HEADER_SIZE + dataSize), true);
    return out;
  }
}

function encodeField(f: Field): Uint8Array {
  const base = BASE[f.type];
  if (f.type === "string") return encodeString(String(f.value), MAX_STRING_BYTES);
  const v = typeof f.value === "number" ? Math.round(f.value) : base.invalid;
  const out = new Uint8Array(base.size);
  const view = new DataView(out.buffer);
  if (base.size === 1) view.setUint8(0, v);
  else if (base.size === 2) view.setUint16(0, v, true);
  else view.setUint32(0, v, true);
  return out;
}
