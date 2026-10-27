import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../lib/cloudinary";

export const uploadBufferToCloudinary = (buffer: Buffer, folder?: string) =>
	new Promise<UploadApiResponse>((resolve, reject) => {
		cloudinary.uploader
			.upload_stream({ resource_type: "auto", folder }, (error, result) => {
				if (error || !result) {
					return reject(error ?? new Error("Cloudinary upload failed"));
				}
				resolve(result);
			})
			.end(buffer);
	});
