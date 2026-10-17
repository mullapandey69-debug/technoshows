import { describe, expect, it } from "vitest";
import { activeProvider } from "@/lib/providers";

describe("Owner-supplied ScreenScape episode mapping", () => {
  it("matches the owner's exact English episode link", () => {
    expect(activeProvider?.buildEmbedUrl(1396, 1, 1)).toBe("https://nxsha.screenscape.me/embed?tmdb=1396&type=tv&s=1&e=1&lan=eng");
  });
  it("maps another episode without retaining the example identifiers", () => {
    expect(activeProvider?.buildEmbedUrl(1399, 2, 3)).toBe("https://nxsha.screenscape.me/embed?tmdb=1399&type=tv&s=2&e=3&lan=eng");
  });
});