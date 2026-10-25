import { getDrawStore } from '../../utils/store'
import { bearerToken, withDrawErrors } from '../../utils/api'

export default defineEventHandler(async (event) => {
  const token = bearerToken(event)
  return await withDrawErrors(() => getDrawStore().invitation(token))
})
