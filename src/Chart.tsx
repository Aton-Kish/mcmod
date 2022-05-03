import { ApexOptions } from 'apexcharts'
import { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'

import { aggregate } from './aggregator'

const Chart = () => {
  const [series, setSeries] = useState<ApexAxisChartSeries>()
  const [options, setOptions] = useState<ApexOptions>()

  useEffect(() => {
    const asyncAggregate = async () => {
      const data = await aggregate()

      const series: ApexAxisChartSeries = Object.values(data.series).map((series) => ({
        name: series.name,
        data: series.metrics.delta,
      }))
      const options: ApexOptions = {
        chart: {
          stacked: false,
          zoom: {
            type: 'x',
            enabled: true,
            autoScaleYaxis: true,
          },
          toolbar: {
            autoSelected: 'zoom',
          },
        },
        dataLabels: {
          enabled: false,
        },
        title: {
          text: 'Downloads',
          align: 'center',
        },
        yaxis: {
          title: {
            text: 'Downloads',
          },
        },
        xaxis: {
          type: 'datetime',
          categories: data.dates,
        },
        tooltip: {
          shared: false,
        },
      }

      setSeries(series)
      setOptions(options)
    }

    asyncAggregate()
  }, [])

  return <div>{series && <ReactApexChart type="line" series={series} height={350} options={options} />}</div>
}

export default Chart
