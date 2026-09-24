import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { Agent } from "undici";

type PublicAddress = {
  address: string;
  family: 4 | 6;
};

export type PublicUrlResolution = {
  hostname: string;
  addresses: PublicAddress[];
};

// Standard web ports only. The entry validator and every redirect hop share
// these predicates so a Location header cannot move the crawl outside the
// declared address policy (protocol, credentials, port).
export function isStandardWebPort(port: string) {
  return !port || port === "80" || port === "443";
}

export function isAllowedWebAddress(url: URL) {
  return ["http:", "https:"].includes(url.protocol) &&
    !url.username &&
    !url.password &&
    isStandardWebPort(url.port);
}

export function assertRedirectTarget(target: URL) {
  if (!["http:", "https:"].includes(target.protocol)) throw new Error("Website redirected to an unsupported address.");
  if (target.username || target.password) throw new Error("Website redirected to a credential-bearing address.");
  if (!isStandardWebPort(target.port)) throw new Error("Website redirected to a non-standard web port.");
}

export function normalizePublicUrl(input: string) {
  const value = input.trim();
  if (!value) throw new Error("Enter a website domain first.");
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP and HTTPS websites can be analyzed.");
  if (url.username || url.password) throw new Error("Website URLs cannot contain credentials.");
  if (!isStandardWebPort(url.port)) throw new Error("Only standard web ports can be analyzed.");
  url.hash = "";
  return url;
}

export function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().split("%")[0].replace(/^\[|\]$/g, "");
  const mappedIpv4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  if (mappedIpv4) return isPrivateAddress(mappedIpv4);
  const mappedHex = normalized.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mappedHex) {
    const high = Number.parseInt(mappedHex[1], 16);
    const low = Number.parseInt(mappedHex[2], 16);
    return isPrivateAddress(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
  }
  if (isIP(normalized) === 4) {
    const [a, b, c] = normalized.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 192 && b === 88 && c === 99) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    );
  }
  if (isIP(normalized) === 6) {
    return normalized === "::" ||
      normalized === "::1" ||
      normalized.startsWith("64:ff9b:") ||
      normalized.startsWith("100:") ||
      normalized.startsWith("2001:db8") ||
      normalized.startsWith("2002:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb") ||
      normalized.startsWith("ff");
  }
  return true;
}

export async function resolvePublicUrl(url: URL): Promise<PublicUrlResolution> {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "").replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    throw new Error("Local or private network addresses cannot be analyzed.");
  }
  const addresses = await lookup(hostname, { all: true, verbatim: true }) as PublicAddress[];
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Local or private network addresses cannot be analyzed.");
  }
  return { hostname, addresses };
}

export async function assertPublicUrl(url: URL) {
  await resolvePublicUrl(url);
}

export function pinnedPublicUrlDispatcher(resolution: PublicUrlResolution) {
  let index = 0;
  return new Agent({
    connect: {
      lookup(hostname, options, callback) {
        if (hostname.toLowerCase().replace(/\.$/, "") !== resolution.hostname) {
          callback(new Error("Pinned DNS lookup hostname mismatch.") as NodeJS.ErrnoException, "", 0);
          return;
        }
        if (options.all) {
          callback(null, resolution.addresses);
          return;
        }
        const address = resolution.addresses[index % resolution.addresses.length];
        index += 1;
        callback(null, address.address, address.family);
      },
    },
  });
}
