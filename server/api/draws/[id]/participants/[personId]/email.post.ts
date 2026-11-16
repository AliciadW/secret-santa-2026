import { bearerToken, withDrawErrors } from '../../../../../utils/api'
import { sendInvitationEmail } from '../../../../../utils/email'
import { getDrawStore } from '../../../../../utils/store'

export default defineEventHandler(async (event) => {
  const key = bearerToken(event)
  const id = getRouterParam(event, 'id') || ''
  return await withDrawErrors(async () => {
    const store = getDrawStore()
    await store.sendEmail(id, key, getRouterParam(event, 'personId') || '', sendInvitationEmail)
    return { ok: true }
  })
})
