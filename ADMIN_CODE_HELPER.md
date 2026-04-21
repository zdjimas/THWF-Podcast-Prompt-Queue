# Optional helper

To update the admin code hash quickly in the browser console:

```js
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
sha256Hex("YourNewAdminCodeHere").then(console.log);
```
