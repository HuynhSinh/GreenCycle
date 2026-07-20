import {
  getAccessCookieOptions,
  getRefreshCookieOptions,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/utils/token.util.js";

describe("token utilities", () => {
  it("hashes token values deterministically without storing the raw token", () => {
    const token = "refresh-token-value";

    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });

  it("signs and verifies access tokens", () => {
    const token = signAccessToken({
      idAccount: "account-1",
      role: "CUSTOMER",
    });
    const payload = verifyAccessToken(token);

    expect(payload.sub).toBe("account-1");
    expect(payload.role).toBe("CUSTOMER");
  });

  it("extends token lifetime when remember me is enabled", () => {
    const account = {
      idAccount: "account-1",
      role: "CUSTOMER",
    };

    const defaultAccessToken = signAccessToken(account);
    const rememberMeAccessToken = signAccessToken(account, { rememberMe: true });
    const defaultRefreshToken = signRefreshToken(account);
    const rememberMeRefreshToken = signRefreshToken(account, { rememberMe: true });

    const defaultAccessPayload = verifyAccessToken(defaultAccessToken);
    const rememberMeAccessPayload = verifyAccessToken(rememberMeAccessToken);
    const defaultRefreshPayload = verifyRefreshToken(defaultRefreshToken);
    const rememberMeRefreshPayload = verifyRefreshToken(rememberMeRefreshToken);

    expect(rememberMeAccessPayload.exp - rememberMeAccessPayload.iat).toBeGreaterThan(
      defaultAccessPayload.exp - defaultAccessPayload.iat,
    );
    expect(rememberMeRefreshPayload.exp - rememberMeRefreshPayload.iat).toBeGreaterThan(
      defaultRefreshPayload.exp - defaultRefreshPayload.iat,
    );
    expect(getAccessCookieOptions(true).maxAge).toBeGreaterThan(getAccessCookieOptions(false).maxAge);
    expect(getRefreshCookieOptions(true).maxAge).toBeGreaterThan(getRefreshCookieOptions(false).maxAge);
  });
});
