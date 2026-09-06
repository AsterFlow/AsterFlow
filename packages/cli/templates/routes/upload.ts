import { Method } from '@asterflow/router'

export default Method.create(Method.POST)
  .multipart({
    avatar: { mimeTypes: ['image/png', 'image/jpeg'], maxSize: 5 * 1024 * 1024, required: true }
  })
  .handler(({ request, response }) => {
    const avatar = request.getFile('avatar')

    return response.success({
      filename: avatar.filename,
      mimeType: avatar.mimeType,
      size: avatar.size
    })
  })
