export interface PhotoMetadata {
  takenOn?: string;
  latitude?: number;
  longitude?: number;
}

type Endian = "little" | "big";

const TYPE_SIZES: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  7: 1,
  9: 4,
  10: 8,
};

export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const metadata = readExif(view);

  if (metadata.takenOn || metadata.latitude !== undefined || metadata.longitude !== undefined) {
    return metadata;
  }

  const fallbackDate = Number.isFinite(file.lastModified) ? new Date(file.lastModified) : null;
  return fallbackDate ? { takenOn: fallbackDate.toISOString().slice(0, 10) } : {};
}

function readExif(view: DataView): PhotoMetadata {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return {};

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;

    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2);
    if (marker === 0xe1 && hasExifHeader(view, offset + 4)) {
      return readTiff(view, offset + 10);
    }

    offset += 2 + length;
  }

  return {};
}

function hasExifHeader(view: DataView, offset: number) {
  return (
    offset + 6 < view.byteLength &&
    view.getUint8(offset) === 0x45 &&
    view.getUint8(offset + 1) === 0x78 &&
    view.getUint8(offset + 2) === 0x69 &&
    view.getUint8(offset + 3) === 0x66 &&
    view.getUint8(offset + 4) === 0 &&
    view.getUint8(offset + 5) === 0
  );
}

function readTiff(view: DataView, tiffOffset: number): PhotoMetadata {
  const endianMarker = readAsciiBytes(view, tiffOffset, 2);
  const endian: Endian | null = endianMarker === "II" ? "little" : endianMarker === "MM" ? "big" : null;
  if (!endian) return {};

  const firstIfdOffset = readUint32(view, tiffOffset + 4, endian);
  const ifd = readIfd(view, tiffOffset, tiffOffset + firstIfdOffset, endian);
  const exifIfdOffset = readSingleNumber(view, tiffOffset, ifd.get(0x8769), endian);
  const gpsIfdOffset = readSingleNumber(view, tiffOffset, ifd.get(0x8825), endian);

  const exifIfd = exifIfdOffset ? readIfd(view, tiffOffset, tiffOffset + exifIfdOffset, endian) : new Map<number, IfdEntry>();
  const gpsIfd = gpsIfdOffset ? readIfd(view, tiffOffset, tiffOffset + gpsIfdOffset, endian) : new Map<number, IfdEntry>();

  const dateTime =
    readAscii(view, tiffOffset, exifIfd.get(0x9003), endian) ||
    readAscii(view, tiffOffset, exifIfd.get(0x9004), endian) ||
    readAscii(view, tiffOffset, ifd.get(0x0132), endian);

  const latitude = readGpsCoordinate(view, tiffOffset, gpsIfd.get(0x0001), gpsIfd.get(0x0002), endian);
  const longitude = readGpsCoordinate(view, tiffOffset, gpsIfd.get(0x0003), gpsIfd.get(0x0004), endian);

  return {
    ...(dateTime ? { takenOn: exifDateToInputDate(dateTime) } : {}),
    ...(latitude !== null ? { latitude } : {}),
    ...(longitude !== null ? { longitude } : {}),
  };
}

interface IfdEntry {
  type: number;
  count: number;
  valueOffset: number;
  inlineValueOffset: number;
}

function readIfd(view: DataView, tiffOffset: number, offset: number, endian: Endian) {
  const entries = new Map<number, IfdEntry>();
  if (offset < 0 || offset + 2 > view.byteLength) return entries;

  const count = readUint16(view, offset, endian);
  for (let index = 0; index < count; index += 1) {
    const entryOffset = offset + 2 + index * 12;
    if (entryOffset + 12 > view.byteLength) break;

    const tag = readUint16(view, entryOffset, endian);
    const type = readUint16(view, entryOffset + 2, endian);
    const valueCount = readUint32(view, entryOffset + 4, endian);
    const byteCount = (TYPE_SIZES[type] ?? 1) * valueCount;
    const rawValue = readUint32(view, entryOffset + 8, endian);
    entries.set(tag, {
      type,
      count: valueCount,
      valueOffset: byteCount <= 4 ? entryOffset + 8 : tiffOffset + rawValue,
      inlineValueOffset: entryOffset + 8,
    });
  }

  return entries;
}

function readGpsCoordinate(
  view: DataView,
  tiffOffset: number,
  refEntry: IfdEntry | undefined,
  coordinateEntry: IfdEntry | undefined,
  endian: Endian,
) {
  const ref = readAscii(view, tiffOffset, refEntry, endian);
  const values = readRationals(view, coordinateEntry, endian);
  if (!ref || values.length < 3) return null;

  const decimal = values[0] + values[1] / 60 + values[2] / 3600;
  return ref === "S" || ref === "W" ? -decimal : decimal;
}

function readSingleNumber(view: DataView, tiffOffset: number, entry: IfdEntry | undefined, endian: Endian) {
  if (!entry) return null;
  if (entry.type === 3) return readUint16(view, entry.inlineValueOffset, endian);
  if (entry.type === 4) return readUint32(view, entry.inlineValueOffset, endian);
  return readUint32(view, entry.valueOffset - tiffOffset, endian);
}

function readAscii(view: DataView, _tiffOffset: number, entry: IfdEntry | undefined, _endian: Endian) {
  if (!entry || entry.type !== 2 || entry.valueOffset + entry.count > view.byteLength) return "";
  return readAsciiBytes(view, entry.valueOffset, entry.count).replace(/\0+$/, "").trim();
}

function readRationals(view: DataView, entry: IfdEntry | undefined, endian: Endian) {
  if (!entry || entry.type !== 5 || entry.valueOffset + entry.count * 8 > view.byteLength) return [];

  return Array.from({ length: entry.count }, (_, index) => {
    const offset = entry.valueOffset + index * 8;
    const numerator = readUint32(view, offset, endian);
    const denominator = readUint32(view, offset + 4, endian);
    return denominator ? numerator / denominator : 0;
  });
}

function exifDateToInputDate(value: string) {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined;
}

function readAsciiBytes(view: DataView, offset: number, count: number) {
  if (offset < 0 || offset + count > view.byteLength) return "";
  return Array.from({ length: count }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join("");
}

function readUint16(view: DataView, offset: number, endian: Endian) {
  return view.getUint16(offset, endian === "little");
}

function readUint32(view: DataView, offset: number, endian: Endian) {
  return view.getUint32(offset, endian === "little");
}
