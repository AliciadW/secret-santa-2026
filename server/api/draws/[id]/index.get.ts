import { getDrawStore } from '../../../utils/store'
import { bearerToken, withDrawErrors } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const key = bearerToken(event)
  return await withDrawErrors(() => getDrawStore().organiser(getRouterParam(event, 'id') || '', key))
})
