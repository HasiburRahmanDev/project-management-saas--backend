import config from "../config";
import { redisClient } from "./redis";

export const getBkashIdToken = async () => {
  try {
    const IdTokenKey = "bkash:idToken";
    const RefreshTokenKey = "bkash:refreshToken";
    let bkashIdToken = await redisClient.get(IdTokenKey);
    const bkashIdTokenTTL = await redisClient.ttl(IdTokenKey);
    let bkashRefreshToken = await redisClient.get(RefreshTokenKey);
    const bkashRefreshTokenTTL = await redisClient.ttl(RefreshTokenKey);
    console.log(
      bkashIdToken,
      bkashIdTokenTTL,
      bkashRefreshToken,
      bkashRefreshTokenTTL,
    );

    if (
      bkashIdTokenTTL <= 600 &&
      bkashRefreshToken &&
      bkashRefreshTokenTTL > 600
    ) {
      const refreshTokenResponse = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefreshToken,
          }),
        },
      );
      if (!refreshTokenResponse.ok) {
        const errorBody = await refreshTokenResponse.text();
        throw new Error(
          `Bkash token refresh failed (${refreshTokenResponse.status}): ${errorBody || "empty response"}`,
        );
      }
      const bkashRefreshTokenResult = await refreshTokenResponse.json();

      bkashIdToken = bkashRefreshTokenResult.id_token as string;
      await redisClient.set(IdTokenKey, bkashIdToken, {
        expiration: {
          type: "EX",
          value: 60 * 60,
        },
      });
      return bkashIdToken;
    }
    if (bkashIdTokenTTL > 600) {
      return bkashIdToken;
    }
    if (bkashIdToken) {
      return bkashIdToken;
    }
    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Bkash access token grant failed (${response.status}): ${errorBody || "empty response"}`,
      );
    }
    const result = await response.json();
    // bkash idtoken set
    await redisClient.set(IdTokenKey, result.id_token, {
      expiration: {
        type: "EX",
        value: 60 * 60,
      },
    });
    // bkash refresh token set
    await redisClient.set(RefreshTokenKey, result.refresh_token, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 28,
      },
    });
    bkashIdToken = result.id_token;
    return bkashIdToken;
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};
