import { useMemo } from "react";
import { Avatar as DicebearAvatar } from "@dicebear/core";
import glyphs from "@dicebear/styles/glyphs.json" with { type: "json" };

export default function Avatar({
  seed = "Alice",
  size = 128,
  width = 64,
  className,
}: {
  seed?: string;
  size?: number;
  width?: number;
  className?: string;
}) {
  const avatar = useMemo(() => {
    return new DicebearAvatar(glyphs, {
      seed,
      size,
    }).toDataUri();
  }, [seed]);

  return <img src={avatar} alt="Avatar" width={width} className={className} />;
}
