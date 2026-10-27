import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import { uploadBufferToCloudinary } from "../../utils/uploadToCloudinary";

const uploadProfileImage = async (buffer: Buffer, userId: string) => {
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      imagePublicId: true,
      imageUrl: true,
    },
  });

  const result = await uploadBufferToCloudinary(buffer, "profile-images");

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    },
    omit: {
      password: true,
    },
  });

  // remove the previous image only after the new one is saved
  if (currentUser?.imagePublicId) {
    cloudinary.uploader
      .destroy(currentUser.imagePublicId)
      .catch((error) => console.log("Failed to delete old image", error));
  }
  return user;
};

export const userServices = {
  uploadProfileImage,
};
