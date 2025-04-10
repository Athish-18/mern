export const uploadImgToCloudinary = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'dwellBaseUploads')

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dvel9khek/image/upload',
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!res.ok) {
    throw new Error('Image upload failed')
  }

  const data = await res.json()
  return data.secure_url
}
