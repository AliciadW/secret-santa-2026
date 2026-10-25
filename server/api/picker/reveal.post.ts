import { getDrawStore } from '../../utils/store'
import { bearerToken, withDrawErrors } from '../../utils/api'

export default defineEventHandler((event) => {
  const token = bearerToken(event)
  return withDrawErrors(() => getDrawStore().reveal(token))
})
