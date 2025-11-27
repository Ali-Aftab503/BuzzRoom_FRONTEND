/**
 * Compresses an image file to a smaller size/quality to avoid server payload limits.
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width of the output image
 * @param {number} quality - JPEG quality (0 to 1)
 * @returns {Promise<string>} - A promise that resolves to the Base64 string of the compressed image
 */
export const compressImage = (file, maxWidth = 400, quality = 0.6) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Initial resize
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Recursive compression function
                const compress = (q) => {
                    const base64 = canvas.toDataURL('image/jpeg', q);
                    // Check if base64 string length is roughly < 70KB (approx 95000 chars)
                    // Base64 is 4/3 larger than binary. 70KB * 1.33 = ~93KB chars.
                    if (base64.length < 95000 || q < 0.2) {
                        console.log(`Final image size: ${Math.round(base64.length / 1024)}KB at Q=${q}`);
                        resolve(base64);
                    } else {
                        // Reduce quality and try again
                        compress(q - 0.1);
                    }
                };

                compress(quality);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
