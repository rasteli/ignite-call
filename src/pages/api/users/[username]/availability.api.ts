import dayjs from 'dayjs'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../../lib/prisma'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.status(405).end()
  }

  const username = String(req.query.username)
  const { date } = req.query

  if (!date) {
    return res.status(400).json({
      error: 'Missing date',
    })
  }

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
    })
  }

  const referenceDate = dayjs(String(date))
  const isPastDate = referenceDate.endOf('day').isBefore(new Date())

  if (isPastDate) {
    return res.json({ availableHours: [], possibleHours: [] })
  }

  const userAvailability = await prisma.userTimeInterval.findFirst({
    where: {
      user_id: user.id,
      week_day: referenceDate.get('day'),
    },
  })

  if (!userAvailability) {
    return res.json({ availableHours: [], possibleHours: [] })
  }

  const { time_start_in_minutes, time_end_in_minutes } = userAvailability

  const startHour = time_start_in_minutes / 60 // e.g. 10
  const endHour = time_end_in_minutes / 60 // e.g. 18

  // e.g. [10, 11, 12, 13, 14, 15, 16, 17]
  const possibleHours = Array.from(
    { length: endHour - startHour },
    (_, i) => startHour + i,
  )

  const blockedHours = await prisma.scheduling.findMany({
    where: {
      user_id: user.id,
      date: {
        gte: referenceDate.set('hour', startHour).toDate(),
        lte: referenceDate.set('hour', endHour).toDate(),
      },
    },
    select: {
      date: true,
    },
  })

  const availableHours = possibleHours.filter((hour) => {
    const isHourBlocked = blockedHours.some(
      (blockedHour) => blockedHour.date.getHours() === hour,
    )

    const isHourInPast = referenceDate.set('hour', hour).isBefore(new Date())

    return !isHourBlocked && !isHourInPast
  })

  return res.json({ availableHours, possibleHours })
}
