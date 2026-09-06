/** biome-ignore-all assist/source/organizeImports: <explanation> */
import bcrypt from "bcryptjs";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../utils/jwt";
import type {
  IForgotPassword,
  IGooglePayload,
  ILoginUserPayload,
  IRegisterUserPayload,
  IRequestUser,
  IResetPassword,
} from "./auth.interface";
import { googleClient } from "../../lib/googleAuth";
// biome-ignore lint/style/useImportType: <explanation>
import { TokenPayload } from "google-auth-library";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";

const registerUser = async (payload: IRegisterUserPayload) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const isUserExists = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExists) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      emailVerified: false,
    },
    omit: { password: true },
  });

  const { ...user } = createdUser;
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: ILoginUserPayload) => {
  const { password } = payload;
  const email = payload.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }

  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("User is deleted");
  }
  if (user.password === null && user.googleId !== null) {
    throw new Error(
      "User already register with Google. Try to login with google",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    password,
    user.password as string,
  );

  if (!isPasswordMatched) {
    throw new Error("Invalid credentials");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const getMe = async (user: IRequestUser) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id: user.userId,
    },
    omit: {
      password: true,
    },
  });

  if (!isUserExists) {
    throw new Error("User not found");
  }

  return isUserExists;
};

const refreshToken = async (token: string) => {
  const verifiedRefreshToken = jwtUtils.verifyToken(
    token,
    config.jwt_refresh_secret,
  );

  if (!verifiedRefreshToken.success || !verifiedRefreshToken.data) {
    throw new Error(
      config.node_env === "development"
        ? verifiedRefreshToken.error
        : "Invalid refresh token",
    );
  }

  const data = verifiedRefreshToken.data as JwtPayload;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new Error("User is inactive or not found");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const googleLogin = async (payload: IGooglePayload) => {
  let googleIdTokenPayload: TokenPayload | null | undefined = null;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.tokenId,
      audience: config.google_client_id,
    });
    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    console.log("Google ID Token verification failed", error);
    throw new Error("Invalid or expired google id token");
  }
  if (!googleIdTokenPayload) {
    throw new Error("Invalid or expired google id token");
  }
  if (!googleIdTokenPayload.email) {
    throw new Error("Email not found");
  }
  if (!googleIdTokenPayload.name) {
    throw new Error("Email user name not found");
  }
  const ifUserExistWithGoogleAuth = await prisma.user.findUnique({
    where: {
      email: googleIdTokenPayload.email,
      googleId: googleIdTokenPayload.sub,
    },
  });
  let user = ifUserExistWithGoogleAuth;
  if (!ifUserExistWithGoogleAuth) {
    const iUsertWithCredentials = await prisma.user.findUnique({
      where: {
        email: googleIdTokenPayload.email,
        authProvider: AuthProvider.CREDENTIAL,
      },
    });
    if (iUsertWithCredentials) {
      if (!iUsertWithCredentials.emailVerified) {
        throw new Error("Email is not verified");
      }
      if (iUsertWithCredentials.status === UserStatus.BLOCKED) {
        throw new Error("User is blocked");
      }
      if (
        iUsertWithCredentials.isDeleted ||
        iUsertWithCredentials.status === UserStatus.DELETED
      ) {
        throw new Error("user is Deleted");
      }
      user = await prisma.user.update({
        where: {
          id: iUsertWithCredentials.id,
        },
        data: {
          googleId: googleIdTokenPayload.sub,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: googleIdTokenPayload.name,
          email: googleIdTokenPayload.email,
          googleId: googleIdTokenPayload.sub,
          authProvider: AuthProvider.GOOGLE,
          emailVerified: true,
          patient: {
            create: {
              name: googleIdTokenPayload.name,
              email: googleIdTokenPayload.email,
            },
          },
        },
      });
    }
  }
  if (!user) {
    throw new Error("user not found");
  }
  if (user.status === UserStatus.BLOCKED) {
    throw new Error("User is blocked");
  }
  if (user.isDeleted || user.status === UserStatus.DELETED) {
    throw new Error("user is Deleted");
  }
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_access_secret,
    config.jwt_access_expires_in as SignOptions,
  );

  const refreshToken = jwtUtils.createToken(
    jwtPayload,
    config.jwt_refresh_secret,
    config.jwt_refresh_expires_in as SignOptions,
  );
  return { accessToken, refreshToken };
};

const forgotPassword = async (payload: IForgotPassword) => {
  const { email } = payload;
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new Error("user is not exists");
  }
  if (isUserExists.status === "BLOCKED") {
    throw new Error("User is blocked");
  }
  if (!isUserExists.emailVerified) {
    throw new Error("User is not verified");
  }
  if (isUserExists.isDeleted || isUserExists.status === "DELETED") {
    throw new Error("User is Deleted");
  }
  if (isUserExists.googleId || isUserExists.authProvider === "GOOGLE") {
    throw new Error("User has account with Google");
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const key = `forgot-password-otp: ${isUserExists.email}`;
  const expiration = 5 * 60;
  await redisClient.set(key, otp, {
    expiration: {
      type: "EX",
      value: 5 * 60,
    },
  });
  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExists.email,
    subject: "forgot password",
    text: `your OTP is ${otp}`,
  });
};
const resetPassword = async (payload: IResetPassword) => {
  const { email, otp, newPassword } = payload;
  const isUserExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!isUserExists) {
    throw new Error("user is not exists");
  }
  if (isUserExists.status === "BLOCKED") {
    throw new Error("User is blocked");
  }
  if (!isUserExists.emailVerified) {
    throw new Error("User is not verified");
  }
  if (isUserExists.isDeleted || isUserExists.status === "DELETED") {
    throw new Error("User is Deleted");
  }
  if (isUserExists.googleId || isUserExists.authProvider === "GOOGLE") {
    throw new Error("User has account with Google");
  }

  const key = `forgot-password-otp: ${isUserExists.email}`;
  const redisOtp = await redisClient.get(key);
  if (!redisOtp) {
    throw new Error("OTP not found");
  }
  if (redisOtp !== otp) {
    throw new Error("OTP does not match");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds),
  );

  await prisma.user.update({
    where: {
      email: isUserExists.email,
    },
    data: {
      password: hashedPassword,
    },
  });

  await redisClient.del([key]);

  await transporter.sendMail({
    from: config.email_sender,
    to: isUserExists.email,
    subject: "password is changed",
    html: `<h1>Your password has been changed </h1>`,
  });
};

export const AuthService = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  googleLogin,
  forgotPassword,
  resetPassword,
};
