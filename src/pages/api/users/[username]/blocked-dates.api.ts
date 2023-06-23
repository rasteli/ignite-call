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
  const { year, month } = req.query

  if (!year || !month) {
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

  const availableWeekdays = await prisma.userTimeInterval.findMany({
    where: {
      user_id: user.id,
    },
    select: {
      week_day: true,
    },
  })

  const blockedWeekDays = [0, 1, 2, 3, 4, 5, 6].filter((weekDay) => {
    return !availableWeekdays.some(
      (a_weekDay) => a_weekDay.week_day === weekDay,
    )
  })

  const blockedDatesRaw = await prisma.$queryRaw<Array<{ day: string }>>`
    SELECT 
      EXTRACT(DAY FROM S.date) AS day,
      COUNT(S.date) AS amount,
      (UTI.time_end_in_minutes - UTI.time_start_in_minutes) / 60 AS size
    FROM schedulings S

    LEFT JOIN user_time_intervals UTI
      ON UTI.week_day = date_part('dow', S.date)
    
    WHERE S.user_id = ${user.id}
      AND TO_CHAR(S.date, 'YYYY-FMMM') = ${`${year}-${month}`}
      
    GROUP BY day, size
    
    HAVING COUNT(S.date) >= (UTI.time_end_in_minutes - UTI.time_start_in_minutes) / 60 
  `

  const blockedDates = blockedDatesRaw.map((item) => Number(item.day))

  return res.json({ blockedWeekDays, blockedDates })
}
