import { ApiError } from './api'

/** Convert pence integer to a £-prefixed display string. e.g. 27999 → "£279.99" */
export const formatPrice = (pence: number): string =>
  `£${(pence / 100).toFixed(2)}`

/** Convert an unknown error into a user-readable string. */
export const formatError = (err: unknown): string => {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 400:
        return err.message || 'Invalid request'
      case 404:
        return 'Not found'
      case 409:
        return 'This cart has already been checked out'
      case 410:
        return 'Your cart has expired — please start a new one'
      case 0:
        return err.message // timeout or network
      default:
        return err.message || 'Something went wrong'
    }
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}
