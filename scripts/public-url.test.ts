import assert from "node:assert/strict";

import { assertRedirectTarget, isAllowedWebAddress, isStandardWebPort, isPrivateAddress, normalizePublicUrl, pinnedPublicUrlDispatcher, resolvePublicUrl } from "../lib/public-url";

async function main() {
  for (const address of [
    "0.0.0.0",
    "10.0.0.1",
    "100.64.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.0.1",
    "192.168.0.1",
    "224.0.0.1",
    "::",
    "::1",
    "::ffff:127.0.0.1",
    "2001:db8::1",
    "fc00::1",
    "fd00::1",
    "fe80::1",
    "ff02::1",
  ]) {
    assert.equal(isPrivateAddress(address), true, `${address} must be blocked`);
  }

  assert.equal(isPrivateAddress("8.8.8.8"), false);
  assert.equal(isPrivateAddress("2606:4700:4700::1111"), false);

  await assert.rejects(
    () => resolvePublicUrl(new URL("http://127.0.0.1")),
    /Local or private network addresses cannot be analyzed/,
  );

  const dispatcher = pinnedPublicUrlDispatcher({
    hostname: "example.com",
    addresses: [{ address: "93.184.216.34", family: 4 }],
  });
  await dispatcher.close();

  // Entry policy (previously untested) and the A2 redirect-hop policy share one port list.
  assert.doesNotThrow(() => normalizePublicUrl("https://example.com/"));
  assert.doesNotThrow(() => normalizePublicUrl("example.com/pricing"));
  assert.equal(normalizePublicUrl("https://example.com/page#section").hash, "", "hashes are dropped");
  assert.throws(() => normalizePublicUrl("https://example.com:8443/"), /Only standard web ports/);
  assert.throws(() => normalizePublicUrl("https://user:pass@example.com/"), /cannot contain credentials/);

  assert.throws(() => assertRedirectTarget(new URL("https://example.com:8443/t")), /redirected to a non-standard web port/);
  assert.throws(() => assertRedirectTarget(new URL("https://user:pass@example.com/")), /credential-bearing address/);
  assert.throws(() => assertRedirectTarget(new URL("ftp://example.com/")), /unsupported address/);
  assert.doesNotThrow(() => assertRedirectTarget(new URL("https://example.com/")));
  assert.doesNotThrow(() => assertRedirectTarget(new URL("http://example.com:80/")));

  assert.equal(isStandardWebPort(""), true);
  assert.equal(isStandardWebPort("443"), true);
  assert.equal(isStandardWebPort("8443"), false);
  assert.equal(isAllowedWebAddress(new URL("https://example.com/")), true);
  assert.equal(isAllowedWebAddress(new URL("https://example.com:8443/")), false);
  assert.equal(isAllowedWebAddress(new URL("https://user:pass@example.com/")), false);

  console.log("Public URL fixtures passed.");
}

void main();
