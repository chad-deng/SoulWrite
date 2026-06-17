export interface WeatherInfo {
  location: string
  description: string
  temperature: number
}

export async function fetchWeather(city: string): Promise<WeatherInfo | null> {
  if (!city.trim()) return null

  try {
    const encoded = encodeURIComponent(city.trim())
    const res = await fetch(`https://wttr.in/${encoded}?format=j1`, {
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    const current = data.current_condition?.[0]
    if (!current) return null

    const description = current.weatherDesc?.[0]?.value ?? '未知天气'
    const temp = parseInt(current.temp_C, 10)

    return {
      location: city,
      description,
      temperature: temp,
    }
  } catch {
    return null
  }
}
