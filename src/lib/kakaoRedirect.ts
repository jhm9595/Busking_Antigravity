export function buildPaymentReturnUrl(
  defaultAppUrl: string,
  returnUrl: string | undefined,
  params: Record<string, string | number | undefined>
) {
  const target = new URL(returnUrl || defaultAppUrl, defaultAppUrl)

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return
    target.searchParams.set(key, String(value))
  })

  return target.toString()
}
