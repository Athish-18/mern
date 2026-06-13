export const uploadPdfToCloudinary = async (file) => {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

  // Using /raw/upload instead of /image/upload for PDFs
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/raw/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!res.ok) {
    throw new Error('PDF upload failed')
  }

  const data = await res.json()
  return data.secure_url
}
