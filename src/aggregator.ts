import dayjs from 'dayjs'

import type { Summary, SummaryMap, Stats, StatsMap, ChartMetricMap, ChartSeriesMap, ChartData } from './types'

const STATS_BASE_URL = import.meta.env.VITE_STATS_BASE_URL

const fetchSummaryMap = async (): Promise<SummaryMap> => {
  const url = `${STATS_BASE_URL}/summary.json`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('cannot fetch stats summary')
  }

  return response.json()
}

const fetchYearlyStats = async (slug: string, year: number): Promise<Stats | null> => {
  const url = `${STATS_BASE_URL}/${slug}/${year}.json`
  const response = await fetch(url)

  if (!response.ok) {
    return null
  }

  return response.json()
}

const fetchStats = async (slug: string, summary: Summary): Promise<Stats> => {
  const { start, end } = summary
  const startYear = dayjs(start).get('year')
  const endYear = dayjs(end).get('year')

  let stats: Stats = {}
  for (let year = startYear; year <= endYear; year++) {
    const yearlyStats = await fetchYearlyStats(slug, year)

    if (yearlyStats === null) {
      break
    }

    stats = { ...stats, ...yearlyStats }
  }

  return stats
}

const fetchStatsMap = async (summaryMap: SummaryMap): Promise<StatsMap> => {
  const statsMap: StatsMap = {}
  await Promise.all(
    Object.entries(summaryMap).map(async ([slug, summary]) => {
      statsMap[slug] = await fetchStats(slug, summary)
    })
  )

  return statsMap
}

const generateDates = (summaryMap: SummaryMap): string[] => {
  const summaries = Object.values(summaryMap)

  const startDate = dayjs(summaries.map((summary) => summary.start).sort()[0])
  const endDate = dayjs(
    summaries
      .map((summary) => summary.end)
      .sort()
      .reverse()[0]
  )

  const dates: string[] = []
  for (let date = startDate; date.isBefore(endDate) || date.isSame(endDate); date = date.add(1, 'day')) {
    dates.push(date.format('YYYY-MM-DD'))
  }

  return dates
}

const calculateDownloadsTotal = (stats: Stats, dates: string[]): (number | null)[] => {
  let prev: number | null = null
  return dates.map((date) => {
    const curr = stats[date]?.downloads ?? null
    const delta = prev !== null && curr !== null ? curr - prev : null
    prev = curr

    if ((delta ?? 0) < 0) {
      console.error(`something wrong with CurseForge API on ${date}`)
      return null
    }

    return curr
  })
}

const calculateDownloadsDelta = (stats: Stats, dates: string[]): (number | null)[] => {
  let prev: number | null = null
  return dates.map((date) => {
    const curr = stats[date]?.downloads ?? null
    const delta = prev !== null && curr !== null ? curr - prev : null
    prev = curr

    if ((delta ?? 0) < 0) {
      console.error(`something wrong with CurseForge API on ${date}`)
      return null
    }

    return delta
  })
}

const generateChartSeries = (statsMap: StatsMap, dates: string[]): ChartSeriesMap =>
  Object.entries(statsMap).reduce((acc, [slug, stats]) => {
    const name = slug
      .split('-')
      .map((str) => `${str.charAt(0).toUpperCase()}${str.slice(1)}`)
      .join(' ')
    const metrics: ChartMetricMap = {
      total: calculateDownloadsTotal(stats, dates),
      delta: calculateDownloadsDelta(stats, dates),
    }

    return { ...acc, [slug]: { name, metrics } }
  }, {})

const generateChartData = async (summaryMap: SummaryMap): Promise<ChartData> => {
  const statsMap = await fetchStatsMap(summaryMap)
  const dates = generateDates(summaryMap)
  const series = generateChartSeries(statsMap, dates)
  return { dates, series }
}

export const aggregate = async (): Promise<ChartData> => {
  const summaryMap = await fetchSummaryMap()
  return await generateChartData(summaryMap)
}
