const { v2: cloudinary } = require("cloudinary");




cloudinary.config({

    cloud_name: process.env.CLOUD_NAME,

    api_key: process.env.API_KEY,

    api_secret: process.env.API_SECRET

});



// Image Upload Function

async function uploadImage(buffer){
    const timeout = 60000; // 60 seconds timeout

    const result = await Promise.race([
        new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "images",
                    timeout: timeout
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            ).end(buffer);
        }),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout: Request took too long')), timeout)
        )
    ]);

    return result;
}



// Export function

module.exports = uploadImage;
