const nadFormatter = new Intl.NumberFormat("en-NA", {
  style: "currency",
  currency: "NAD",
  currencyDisplay: "code",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatNAD(value) {
  return nadFormatter.format(Number(value || 0));
}
