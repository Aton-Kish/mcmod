export interface Summary {
  start: string
  end: string
}

export interface SummaryMap {
  [slug: string]: Summary
}

export interface Stat {
  datetime: string
  downloads: number
}

export interface Stats {
  [date: string]: Stat
}

export interface StatsMap {
  [slug: string]: Stats
}

export interface ChartMetricMap {
  [name: string]: (number | null)[]
}

export interface ChartSeries {
  name: string
  metrics: ChartMetricMap
}

export interface ChartSeriesMap {
  [slug: string]: ChartSeries
}

export interface ChartData {
  dates: string[]
  series: ChartSeriesMap
}
