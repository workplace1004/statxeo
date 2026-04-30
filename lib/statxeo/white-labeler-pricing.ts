export type WhiteLabelerPricingInput = {
  amountSoldCents: number
  baseCostCents: number
  whiteLabelFeeCents: number
}

function sanitizeMoneyCents(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.round(value))
}

export function calculateWhiteLabelerNetPayout(input: WhiteLabelerPricingInput) {
  const amountSoldCents = sanitizeMoneyCents(input.amountSoldCents)
  const baseCostCents = sanitizeMoneyCents(input.baseCostCents)
  const whiteLabelFeeCents = sanitizeMoneyCents(input.whiteLabelFeeCents)

  const netPayoutCents = Math.max(0, amountSoldCents - (baseCostCents + whiteLabelFeeCents))

  return {
    amountSoldCents,
    baseCostCents,
    whiteLabelFeeCents,
    netPayoutCents,
  }
}
