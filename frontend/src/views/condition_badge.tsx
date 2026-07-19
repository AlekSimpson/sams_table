import { Badge } from './components'

interface ConditionBadgeProps {
  condition: string
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  return <Badge variant="danger">{condition}</Badge>
}
