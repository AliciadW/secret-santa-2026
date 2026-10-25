import { getDrawStore } from '../../../utils/store'
import { bearerToken, withDrawErrors } from '../../../utils/api'

export default defineEventHandler((event) => {
  const key = bearerToken(event)
  return withDrawErrors(() => getDrawStore().organiser(getRouterParam(event, 'id') || '', key))
})
