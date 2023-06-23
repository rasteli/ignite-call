import { Heading, MultiStep, Text, Button } from '@ignite-ui/react'
import { ArrowRight, Check } from 'phosphor-react'
import { useRouter } from 'next/router'
import { signIn, useSession } from 'next-auth/react'
// import { api } from '../../../lib/axios'
import { Container, Header } from '../styles'
import { AuthError, ConnectBox, ConnectItem } from './styles'
import { NextSeo } from 'next-seo'

export default function ConnectCalendar() {
  const session = useSession()
  const router = useRouter()

  const hasAuthError = !!router.query.error
  const isAuthenticated = session.status === 'authenticated'

  async function handleConnectCalendar() {
    await signIn('google')
  }

  async function handleNextStep() {
    await router.push('/register/time-intervals')
  }

  return (
    <>
      <NextSeo title="Conecte sua agenda do Google | Ignite Call" noindex />

      <Container>
        <Header>
          <Heading as="strong">Conecte sua agenda!</Heading>
          <Text>
            Conecte o seu calendário para verificar automaticamente as horas
            ocupadas e os novos eventos à medida em que são agendados.
          </Text>
          <MultiStep size={4} currentStep={2} />
        </Header>

        <ConnectBox>
          <ConnectItem>
            <Text>Google Calendar</Text>
            <Button
              variant="secondary"
              size="sm"
              disabled={isAuthenticated}
              onClick={handleConnectCalendar}
            >
              {isAuthenticated ? (
                <>
                  Conectado
                  <Check weight="bold" />
                </>
              ) : (
                <>
                  Conectar
                  <ArrowRight weight="bold" />
                </>
              )}
            </Button>
          </ConnectItem>

          {hasAuthError && (
            <AuthError size="sm">
              Falha ao se conectar ao Google, verifique se você habilitou as
              permissões de acesso ao Google Calendar.
            </AuthError>
          )}

          <Button disabled={!isAuthenticated} onClick={handleNextStep}>
            Próximo passo
            <ArrowRight weight="bold" />
          </Button>
        </ConnectBox>
      </Container>
    </>
  )
}
