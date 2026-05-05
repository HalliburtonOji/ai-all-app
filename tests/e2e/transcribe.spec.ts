import { test, expect } from "./auth-fixture";
import { createProject } from "./helpers";

test.describe("Phase 21 — Studio audio transcription (Whisper)", () => {
  test("upload a tiny audio file → transcript appears as a text output (mock mode)", async ({
    page,
  }) => {
    const projectId = await createProject(page, {
      name: "Transcription happy path",
      type: "channel",
    });

    await page.goto(`/projects/${projectId}?tab=studio`);
    // The transcribe tool card is in the Studio grid.
    await expect(
      page.locator('[data-studio-tool-card="transcribe"]'),
    ).toBeVisible();
    await page.locator('[data-studio-tool-card="transcribe"]').click();
    await expect(
      page.locator('[data-studio-panel="transcribe"]'),
    ).toBeVisible();

    // Synthesize a tiny mp3 file and feed it to the file input. We
    // attach a minimal-but-non-empty buffer; in test mode the server
    // never sends it to Whisper, so any bytes are fine.
    const fileInput = page.locator('[data-transcribe-input="true"]');
    await fileInput.setInputFiles({
      name: "voice-memo.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from([
        0xff, 0xfb, 0x10, 0xc4,
        ...new Uint8Array(101).fill(0),
      ]),
    });

    // The transcript appears in the gallery as a text tile, with the
    // mock-mode marker in its content.
    await expect(
      page.locator('[data-studio-output-kind="text"]').first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.locator('[data-studio-output-kind="text"]').first(),
    ).toContainText("[mock-transcript]");
    await expect(
      page.locator('[data-studio-output-kind="text"]').first(),
    ).toContainText("voice-memo.mp3");
  });
});
