import { google } from 'googleapis'
import { prisma } from './prisma'
import dayjs from 'dayjs'

export async function getGoogleOAuthToken(userId: string) {
  const account = await prisma.account.findFirstOrThrow({
    where: {
      user_id: userId,
      provider: 'google',
    },
  })

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  )

  auth.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at * 100,
  })

  if (!account.expires_at) {
    return auth
  }

  const isTokenExpired = dayjs(account.expires_at * 1000).isBefore(new Date())

  if (isTokenExpired) {
    const { credentials } = await auth.refreshAccessToken()

    await prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        access_token: credentials.access_token,
        expires_at: credentials.expiry_date / 100,
        refresh_token: credentials.refresh_token,
        id_token: credentials.id_token,
        scope: credentials.scope,
        token_type: credentials.token_type,
      },
    })

    auth.setCredentials({
      access_token: credentials.access_token,
      expiry_date: credentials.expiry_date,
      refresh_token: credentials.refresh_token,
    })
  }

  return auth
}
