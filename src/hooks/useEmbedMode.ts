export async function resolveImageParam(param: string): Promise<File | null> {
  try {
    const fixed = param.replace(/ /g, "+");
    if (fixed.startsWith("data:")) {
      const res = await fetch(fixed);
      const blob = await res.blob();
      return new File([blob], "image", { type: blob.type });
    }
    if (fixed.startsWith("base64,")) {
      const base64 = fixed.slice(7);
      const res = await fetch(`data:image/png;base64,${base64}`);
      const blob = await res.blob();
      return new File([blob], "image.png", { type: "image/png" });
    }
    const res = await fetch(fixed);
    const blob = await res.blob();
    return new File([blob], "image", { type: blob.type });
  } catch {
    return null;
  }
}
