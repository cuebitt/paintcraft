# .paint file format

Uncompressed NBT binary format. Three variants exist, each based on a different version of the Joy of Painting mod.

## jop-1x (xercapaint 1.1.0 base)

The original format. Supports four canvas sizes.

**NBT schema:**

```jsonc
{
  // Required:
  "pixels":  int[],   // ARGB 0xAARRGGBB, row-major, length = w * h
  "ct":      byte,    // 0=SMALL, 1=LARGE, 2=LONG, 3=TALL

  // Conditional: both present XOR both absent:
  "title":  string,   // max 16 chars (truncated on import)
  "author": string,   // max 16 chars (truncated on import)

  // Conditional: required when title present:
  "name":  string,    // UUID regex: ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_\d+$
  "v":     int,       // version, default 1
  "generation": int   // 0=original, 1=copy, 2=copy-of-copy, etc. Incremented by 1 on import if > 0.
}
```

**CanvasType (4 types):**

| ct  | Name  | Width | Height | Pixels |
| --- | ----- | ----- | ------ | ------ |
| 0   | SMALL | 16    | 16     | 256    |
| 1   | LARGE | 32    | 32     | 1024   |
| 2   | LONG  | 32    | 16     | 512    |
| 3   | TALL  | 16    | 32     | 512    |

**Import rules:**

- `title`/`author` XOR constraint, both or neither, else "broken paint file"
- `ct` 0 to 3 only; `fromByte` returns `null` for anything else, "broken paint file"
- `name` validated against UUID regex when signed
- `generation` incremented by 1 on import if > 0; removed entirely for unsigned paintings
- No `glass`, `sidePixels`, or `sidesActive` fields

---

## jop-2x (xercapaint 2.0.1)

Adds glass canvas and side painting support. Based on the original 4 canvas types.

**NBT schema:**

```jsonc
{
  // Required:
  "pixels":  int[],   // ARGB 0xAARRGGBB, row-major, length = w * h
  "ct":      byte,    // 0=SMALL, 1=LARGE, 2=LONG, 3=TALL

  // Optional: glass canvas:
  "glass":  byte,     // 0 or 1. Default absent/false.

  // Conditional: side painting:
  "sidePixels":  int[],   // Present if sidesActive. Length = 2w + 2h.
                          // Order: top(w), bottom(w), left(h), right(h).
  "sidesActive": byte,    // 0 or 1. Only present when sidePixels is present.

  // Conditional: both present XOR both absent:
  "title":  string,   // max 16 chars (truncated on import)
  "author": string,   // max 16 chars (truncated on import)

  // Conditional: required when title present:
  "name":  string,    // UUID regex: ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}_\d+$
  "v":     int,       // version, default 1
  "generation": int   // 0-3. Incremented by 1 on import if > 0 and < 3 (capped at 3).
}
```

**CanvasType (4 types):** Same as jop-1x (SMALL/LARGE/LONG/TALL).

**CanvasSides constants:**

- Default side pixel color (non-glass): `0xFFF9FBFE` (`-393218`)
- Default side pixel color (glass): `0x00000000`
- Side count formula: `2 * width + 2 * height`
- Layout order: top(width), bottom(width), left(height), right(height)

**Changes from 1.1.0:**

- Adds `glass` (byte), `sidePixels` (int[]), `sidesActive` (byte)
- `CanvasType.fromByte` defaults to `SMALL` for unknown values instead of returning null
- `generation` increment capped: only increments if `> 0 && < 3` (not just `> 0`)
- Removes the `tag == null` null check present in 1.1.0 base
- Imports `glass` via `tag.getBoolean("glass")` and matches it against the held canvas item
- No `canvasItemFor()` helper, creates items via `new ItemStack(ItemCanvas.canvasItemFor(type, glass))`
- Canvas type mismatch error includes glass material check ("xercapaint.import.fail.material")

---

## jop-delta (Cobblemon Delta)

Same schema as jop-1x, but extends CanvasType from 4 to 10 entries. The NBT format itself is unchanged.

**CanvasType (10 types):**

| ct  | Name              | Width | Height | Pixels |
| --- | ----------------- | ----- | ------ | ------ |
| 0   | SMALL             | 16    | 16     | 256    |
| 1   | LARGE             | 32    | 32     | 1024   |
| 2   | LONG              | 32    | 16     | 512    |
| 3   | TALL              | 16    | 32     | 512    |
| 4   | EXTRA_LARGE       | 48    | 48     | 2304   |
| 5   | EXTRA_EXTRA_LARGE | 64    | 64     | 4096   |
| 6   | EXTRA_LONG        | 48    | 32     | 1536   |
| 7   | EXTRA_EXTRA_LONG  | 64    | 48     | 3072   |
| 8   | EXTRA_TALL        | 32    | 48     | 1536   |
| 9   | EXTRA_EXTRA_TALL  | 48    | 64     | 3072   |

**Changes from base:**

- `CanvasType` uses fields (`width`, `height`, `id`) instead of a switch
- `fromByte` iterates `values()`, supports all 10 types
- Creative-mode canvas lookup uses `Items.canvasItemFor(type)` instead of a switch with 4 cases
- Import command requires op level 2 (`requires(source -> source.hasPermissionLevel(2))`)
- `.paint` file tags are identical to base, no new NBT keys added

---

## Summary of field support

| Field         | jop-1x | jop-2x | jop-delta |
| ------------- | ------ | ------ | --------- |
| `pixels`      | ✓      | ✓      | ✓         |
| `ct` (range)  | 0 to 3 | 0 to 3 | 0 to 9    |
| `title`       | ✓      | ✓      | ✓         |
| `author`      | ✓      | ✓      | ✓         |
| `name`        | ✓      | ✓      | ✓         |
| `v`           | ✓      | ✓      | ✓         |
| `generation`  | ✓      | ✓      | ✓         |
| `glass`       | ✗      | ✓      | ✗         |
| `sidePixels`  | ✗      | ✓      | ✗         |
| `sidesActive` | ✗      | ✓      | ✗         |
