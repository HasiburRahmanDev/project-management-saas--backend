import { tr } from "zod/locales";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";

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
  cloudinary.uploader
    .upload_stream(
      {
        resource_type: "auto",
      },
      async (error, result) => {
        if (error) {
          console.log(error);
        }

        console.log("result", result);

        const user = await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            imageUrl: result?.secure_url,
            imagePublicId: result?.public_id,
          },
        });
      },
    )
    .end(buffer);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    omit: {
      password: true,
    },
  });
  if (currentUser?.imagePublicId && currentUser.imageUrl) {
    cloudinary.uploader.destroy(currentUser.imagePublicId);
  }
  return user;
};

export const userServices = {
  uploadProfileImage,
};
