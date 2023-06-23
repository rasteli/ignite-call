import dayjs from 'dayjs'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useQuery } from '@tanstack/react-query'
import { Calendar } from '../../../../../components/Calendar'
import {
  Container,
  TimePicker,
  TimePickerHeader,
  TimePickerItem,
  TimePickerList,
} from './styles'
import { api } from '../../../../../lib/axios'

interface Availability {
  possibleHours: number[]
  availableHours: number[]
}

interface CalendarStepProps {
  onSelectDateTime: (date: Date) => void
}

export function CalendarStep({ onSelectDateTime }: CalendarStepProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState<Date>(null)

  const isDateSelected = !!selectedDate
  const username = String(router.query.username)

  const weekDay = selectedDate ? dayjs(selectedDate).format('dddd') : ''
  const weekDate = selectedDate ? dayjs(selectedDate).format('D[ de ]MMMM') : ''
  const queryDate = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : ''

  const { data: availability } = useQuery<Availability>(
    ['availability', queryDate],
    async () => {
      const response = await api.get(`/users/${username}/availability`, {
        params: {
          date: queryDate,
        },
      })

      return response.data
    },
    {
      enabled: !!selectedDate,
    },
  )

  function handleSelectTime(hour: number) {
    const dateTime = dayjs(selectedDate)
      .set('hour', hour)
      .startOf('hour')
      .toDate()

    onSelectDateTime(dateTime)
  }

  return (
    <Container isTimePickerOpen={isDateSelected}>
      <Calendar selectedDate={selectedDate} onDateSelected={setSelectedDate} />

      {isDateSelected && (
        <TimePicker>
          <TimePickerHeader>
            {weekDay} <span>{weekDate}</span>
          </TimePickerHeader>

          <TimePickerList>
            {availability?.possibleHours.map((hour) => (
              <TimePickerItem
                key={hour}
                onClick={() => handleSelectTime(hour)}
                disabled={!availability?.availableHours.includes(hour)}
              >
                {String(hour).padStart(2, '0')}:00h
              </TimePickerItem>
            ))}
          </TimePickerList>
        </TimePicker>
      )}
    </Container>
  )
}
