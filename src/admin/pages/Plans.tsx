import { PageHeader, NotBuilt } from '../ui'
export default function Plans() {
  return <><PageHeader title="Planos e pagamentos">Planos contratados e acompanhamento manual de pagamentos. Não há cobrança online.</PageHeader>
    <NotBuilt items={['Plano contratado por família', 'Registro manual de pagamentos recebidos']} /></>
}
