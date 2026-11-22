// Serves /media/* for the Worker in index.js. See media() below.

// Videos and other files in /media/. The static file server always sends the whole file, even when the
// browser asks for one byte range, so a video can't be skipped forward or back. This answers a request
// for a range ("Range: bytes=START-END") with just those bytes and a 206 status, and tells the browser
// that ranges work ("Accept-Ranges: bytes"). A request with no range gets the file as before.
export async function media(request, env) {
  const range = request.headers.get("Range");
  if (!range || (request.method !== "GET" && request.method !== "HEAD")) return withRanges(await env.ASSETS.fetch(request));
  // Ask for the whole file, without the range or any "only if changed" headers, then cut out the range.
  const res = await env.ASSETS.fetch(new Request(request.url, { method: "GET" }));
  if (res.status !== 200 || !res.body) return withRanges(res);
  const buf = await res.arrayBuffer();
  const size = buf.byteLength;
  const span = parseRange(range, size);
  const headers = new Headers(res.headers);
  headers.set("Accept-Ranges", "bytes");
  // A range that can't be read, such as one that starts past the end, gets the file size and a 416.
  if (span === "invalid") {
    headers.set("Content-Range", `bytes */${size}`);
    headers.delete("Content-Length");
    return new Response(null, { status: 416, headers });
  }
  // Several ranges in one request are rare for video, so those get the whole file.
  if (!span) return new Response(request.method === "HEAD" ? null : buf, { status: 200, headers });
  const [start, end] = span;
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(request.method === "HEAD" ? null : buf.slice(start, end + 1), { status: 206, headers });
}

// "bytes=0-99", "bytes=500-" and "bytes=-500" (the last 500 bytes). Returns [start, end], null for a
// header this doesn't handle, or "invalid" for a range outside the file.
export function parseRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (m[1] === "" && m[2] === "")) return null;
  let start, end;
  if (m[1] === "") {
    const n = Number(m[2]);
    if (n === 0) return "invalid";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }
  if (start >= size || start > end) return "invalid";
  return [start, end];
}

function withRanges(res) {
  if (res.status !== 200 && res.status !== 304) return res;
  const out = new Response(res.body, res);
  out.headers.set("Accept-Ranges", "bytes");
  return out;
}
