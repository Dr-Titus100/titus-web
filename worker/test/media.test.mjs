// Run with: node --test worker/test/
// Checks that /media/ files answer byte-range requests, which a browser needs to skip around in a video.
import test from "node:test";
import assert from "node:assert/strict";
import { media, parseRange } from "../media.js";

const file = new Uint8Array(1000).map((_, i) => i % 256);
const env = {
  ASSETS: {
    // Like the static file server: always the whole file, whatever the Range header says.
    async fetch(req) {
      return new Response(req.method === "HEAD" ? null : file, { status: 200, headers: { "Content-Type": "video/mp4", "Content-Length": "1000", ETag: '"v2"', "Last-Modified": "Sun, 22 Nov 2026 07:00:00 GMT" } });
    },
  },
};
const get = (range, method = "GET", extra = {}) =>
  media(new Request("https://example.com/media/v.mp4", { method, headers: { ...(range ? { Range: range } : {}), ...extra } }), env);

test("a request without a range gets the whole file and says ranges work", async () => {
  const res = await get();
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Accept-Ranges"), "bytes");
  assert.equal((await res.arrayBuffer()).byteLength, 1000);
});

test("a range gets just those bytes with a 206", async () => {
  const res = await get("bytes=100-199");
  assert.equal(res.status, 206);
  assert.equal(res.headers.get("Content-Range"), "bytes 100-199/1000");
  assert.equal(res.headers.get("Content-Length"), "100");
  const body = new Uint8Array(await res.arrayBuffer());
  assert.equal(body.length, 100);
  assert.equal(body[0], 100);
});

test("open-ended and last-bytes ranges work, and an end past the file is cut to the file", async () => {
  assert.equal((await get("bytes=900-")).headers.get("Content-Range"), "bytes 900-999/1000");
  assert.equal((await get("bytes=-10")).headers.get("Content-Range"), "bytes 990-999/1000");
  assert.equal((await get("bytes=950-5000")).headers.get("Content-Range"), "bytes 950-999/1000");
});

test("a range that starts past the end gets a 416", async () => {
  const res = await get("bytes=2000-");
  assert.equal(res.status, 416);
  assert.equal(res.headers.get("Content-Range"), "bytes */1000");
});

test("several ranges at once get the whole file", async () => {
  const res = await get("bytes=0-9,20-29");
  assert.equal(res.status, 200);
  assert.equal((await res.arrayBuffer()).byteLength, 1000);
});

test("If-Range sends the range only when the file is the same version", async () => {
  assert.equal((await get("bytes=0-9", "GET", { "If-Range": '"v2"' })).status, 206);
  assert.equal((await get("bytes=0-9", "GET", { "If-Range": "Sun, 22 Nov 2026 07:00:00 GMT" })).status, 206);
  // An old ETag, an old date or a weak ETag gets the whole current file instead.
  for (const old of ['"v1"', "Sat, 21 Nov 2026 07:00:00 GMT", 'W/"v2"']) {
    const res = await get("bytes=0-9", "GET", { "If-Range": old });
    assert.equal(res.status, 200);
    assert.equal((await res.arrayBuffer()).byteLength, 1000);
  }
});

test("parseRange reads the forms browsers send", () => {
  assert.deepEqual(parseRange("bytes=0-", 10), [0, 9]);
  assert.deepEqual(parseRange("bytes=3-4", 10), [3, 4]);
  assert.equal(parseRange("bytes=5-2", 10), "invalid");
  assert.equal(parseRange("items=0-1", 10), null);
});
