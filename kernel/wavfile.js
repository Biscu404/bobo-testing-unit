/* An AudioBuffer as a .wav: 16 or 24 bits, optionally evened out to a loudness
   ceiling first, and (at 16 bits) dithered, so the quiet tails do not grit. */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

/* o: { bits: 16 | 24, normalize: dBFS peak to bring it to, or null, dither: bool, from, to: seconds } */
export function wavBlob(buf, o) {
  o = o || {};
  const bits = o.bits === 24 ? 24 : 16, ch = buf.numberOfChannels, sr = buf.sampleRate;
  const i0 = Math.max(0, Math.floor((o.from || 0) * sr)), i1 = Math.min(buf.length, o.to == null ? buf.length : Math.ceil(o.to * sr));
  const n = Math.max(0, i1 - i0), bytes = bits / 8;
  const data = [];
  for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let gain = 1;
  if (o.normalize != null) {
    let pk = 0;
    for (let c = 0; c < ch; c++) for (let i = i0; i < i1; i++) { const v = Math.abs(data[c][i]); if (v > pk) pk = v; }
    if (pk > 1e-5) gain = Math.pow(10, o.normalize / 20) / pk;
  }
  const out = new DataView(new ArrayBuffer(44 + n * ch * bytes));
  const w = (off, s) => { for (let i = 0; i < s.length; i++) out.setUint8(off + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * bytes, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true);
  out.setUint16(22, ch, true); out.setUint32(24, sr, true); out.setUint32(28, sr * ch * bytes, true);
  out.setUint16(32, ch * bytes, true); out.setUint16(34, bits, true); w(36, 'data'); out.setUint32(40, n * ch * bytes, true);
  let p = 44;
  const dither = o.dither !== false && bits === 16;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) {
    let v = data[c][i0 + i] * gain;
    if (bits === 16) {
      if (dither) v += (Math.random() - Math.random()) / 32768;        /* triangular, one least-significant bit wide */
      v = clamp(v, -1, 1);
      out.setInt16(p, v < 0 ? v * 0x8000 : v * 0x7fff, true); p += 2;
    } else {
      v = clamp(v, -1, 1);
      const x = Math.round(v < 0 ? v * 0x800000 : v * 0x7fffff);
      out.setUint8(p, x & 255); out.setUint8(p + 1, (x >> 8) & 255); out.setUint8(p + 2, (x >> 16) & 255); p += 3;
    }
  }
  return new Blob([out.buffer], { type: 'audio/wav' });
}
