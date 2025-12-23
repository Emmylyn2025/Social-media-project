import cloudinary from "./cloudinary.js"

const uploadToCloudinary = async (filePath) => {
  try{

    const result = await cloudinary.uploader.upload(filePath);

    return{
      fileSecureUrl: result.secure_url,
      filePublicId: result.public_id
    }

  } catch(error) {
    console.log(error.message);
    throw new Error("Error while uploading to cloudinary")
  }
}

export default uploadToCloudinary;