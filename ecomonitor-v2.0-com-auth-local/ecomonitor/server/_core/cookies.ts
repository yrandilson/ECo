import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const isSecure = isSecureRequest(req);
  const isLocalhost = req.hostname === "localhost" || req.hostname === "127.0.0.1";
  
  return {
    httpOnly: true,
    path: "/",
    // Em desenvolvimento (localhost/http), usar "lax"; em produção (https), usar "none"
    sameSite: isSecure || !isLocalhost ? "none" : "lax",
    // Secure só deve ser true em HTTPS; em localhost HTTP, deixar false
    secure: isSecure && !isLocalhost,
  };
}
