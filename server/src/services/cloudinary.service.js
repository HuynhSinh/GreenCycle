import crypto from "crypto";
import { config } from "../config/index.js";
import AppError from "../utils/AppError.js";

const ensureCloudinaryConfig = () => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new AppError("Cloudinary is not configured", 500);
  }
};

const signUploadParams = (params) => {
  const sorted = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto.createHash("sha1").update(`${sorted}${config.cloudinary.apiSecret}`).digest("hex");
};

export const uploadRewardImage = async (imageDataUri) => {
  ensureCloudinaryConfig();

  const timestamp = Math.floor(Date.now() / 1000);
  const uploadParams = {
    folder: config.cloudinary.folder,
    timestamp,
  };
  const signature = signUploadParams(uploadParams);
  const body = new FormData();

  body.set("file", imageDataUri);
  body.set("api_key", config.cloudinary.apiKey);
  body.set("folder", uploadParams.folder);
  body.set("timestamp", String(timestamp));
  body.set("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new AppError(data?.error?.message || "Could not upload reward image", 502);
  }

  return data.secure_url;
};
