const pairs = [
  { name: 'Pending badge', foreground: '#78350f', background: '#fef3c7' },
  { name: 'Confirmed badge', foreground: '#1e3a8a', background: '#dbeafe' },
  { name: 'Completed badge', foreground: '#583305', background: '#fde4c4' },
  { name: 'Canceled badge', foreground: '#991b1b', background: '#fee2e2' },
  { name: 'No-show badge', foreground: '#1f2937', background: '#e5e7eb' },
  { name: 'Deposit notice', foreground: '#451a03', background: '#fef3c7' },
  { name: 'Availability notice', foreground: '#451a03', background: '#fde68a' },
]

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  }
}

function luminanceChannel(value) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return (0.2126 * luminanceChannel(r)) + (0.7152 * luminanceChannel(g)) + (0.0722 * luminanceChannel(b))
}

function contrastRatio(foreground, background) {
  const fg = relativeLuminance(foreground)
  const bg = relativeLuminance(background)
  const lighter = Math.max(fg, bg)
  const darker = Math.min(fg, bg)
  return (lighter + 0.05) / (darker + 0.05)
}

const failures = pairs
  .map((pair) => ({ ...pair, ratio: contrastRatio(pair.foreground, pair.background) }))
  .filter((pair) => pair.ratio < 4.5)

if (failures.length > 0) {
  failures.forEach((failure) => {
    console.error(`${failure.name} contrast failed: ${failure.ratio.toFixed(2)}:1`)
  })
  process.exit(1)
}

pairs.forEach((pair) => {
  console.log(`${pair.name}: ${contrastRatio(pair.foreground, pair.background).toFixed(2)}:1`)
})
