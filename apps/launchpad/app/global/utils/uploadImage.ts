export const uploadImage = async (file: File) => {
  if (!file) {
    return
  }
  const data = new FormData()
  data.append('image', file)
  const IMG_BB_API_KEY = '61209716da77f8f3ba5e5d7b59851ed5'
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMG_BB_API_KEY}`, {
    body: data,
    method: 'POST',
  })

  const res = await response.json()

  return res?.data?.display_url || ''
}
