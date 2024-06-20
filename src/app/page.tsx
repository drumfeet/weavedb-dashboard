"use client"
import { srcTxIds, versions } from "@/lib/const"
import {
  Card,
  Title,
  BarChart,
  Subtitle,
  Metric,
  Text,
  LineChart,
  Flex,
  BadgeDelta,
} from "@tremor/react"
import { dataFormatter, fetchDataByTxId } from "@/lib/func"
import { useEffect, useState } from "react"
import Head from "next/head"
import Header from "@/components/Header"
import {
  MonthlyQueriesData,
  YearlyDeploymentData,
  MonthlyDeploymentData,
  VersionDeploymentData,
  SourceData,
  MonthlyGrowthRateData,
} from "@/lib/types"
import Background from "@/components/Background"

export default function Home() {
  const [totalQueries, setTotalQueries] = useState<number | null>(null)
  const [totalDeployment, setTotalDeployment] = useState<number | null>(null)
  const [versionDeployment, setVersionDeployment] = useState<
    VersionDeploymentData[]
  >([])
  const [monthlyDeployment, setMonthlyDeployment] = useState<
    MonthlyDeploymentData[]
  >([])
  const [yearlyDeployment, setYearlyDeployment] = useState<
    YearlyDeploymentData[]
  >([])
  const [yearlyGrowthRate, setYearlyGrowthRate] = useState<number | null>(null)
  const [monthlyQueries, setMonthlyQueries] = useState<MonthlyQueriesData[]>([])
  const [monthlyGrowthRate, setMonthlyGrowthRate] = useState<
    MonthlyGrowthRateData[]
  >([])
  const [srcData, setSrcData] = useState<Map<string, SourceData>>(new Map());
  const [srcContracts, setSrcContracts] = useState(srcTxIds)

  const fetchDeployedDatabase = async (sourceData: SourceData[]) => {
    const _totalDeployment = sourceData.reduce((total, data) => {
      return total + (data?.paging?.items || 0)
    }, 0)

    const _versionDeployment: VersionDeploymentData[] = ([] = sourceData.map(
      (data, index) => {
        return {
          name: versions[index].version,
          "Deployed database count": data?.paging?.items,
        }
      }
    ))

    setTotalDeployment(_totalDeployment)
    setVersionDeployment(_versionDeployment)
    console.log("_totalDeployment", _totalDeployment)
    console.log("_versionDeployment", _versionDeployment)
  }

  const fetchTotalQueries = async (sourceData: SourceData[]) => {
    const _totalQueries = sourceData.reduce((total, source) => {
      return (
        total +
        source.contracts.reduce((contractTotal, contract) => {
          // Correctly parse the interactions count as a number, defaulting to 0 if not present.
          const _count = Number(contract?.interactions || 0)

          if (_count > 1000) {
            console.log(`contractId: ${contract.contractId} _count: ${_count}`);
          }

          // Return the updated total for contracts.
          return contractTotal + _count
        }, 0)
      )
    }, 0)
    setTotalQueries(_totalQueries)
    console.log("_totalQueries:", _totalQueries)
  }

  const fetchDeploymentByMonth = async (sourceData: SourceData[]) => {
    const countsByMonth: Record<string, number> = {}

    // Counting the contracts by month
    sourceData.forEach((data) => {
      data.contracts.forEach((contract) => {
        const date = new Date(Number(contract.blockTimestamp) * 1000)
        const monthYearKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`

        countsByMonth[monthYearKey] = (countsByMonth[monthYearKey] || 0) + 1
      })
    })

    // Converting to an array and sorting by date
    const sortedDates = Object.keys(countsByMonth).sort()
    let _accumulatedTotal = 0
    const _monthlyDeployment = [
      { date: "2022-10", Total: 0 },
      ...sortedDates.map((date) => {
        _accumulatedTotal += countsByMonth[date]
        return {
          date,
          Total: _accumulatedTotal,
        }
      }),
    ]
    setMonthlyDeployment(_monthlyDeployment)
    console.log("_monthlyDeployment:", _monthlyDeployment)
  }

  const fetchDeploymentPerYear = async (sourceData: SourceData[]) => {
    const countsByYear: Record<string, number> = {}

    sourceData.forEach((data, index) => {
      data.contracts.forEach((contract) => {
        const yearKey = versions[index].year
        countsByYear[yearKey] = (countsByYear[yearKey] || 0) + 1
      })
    })

    const _yearlyDeployment: YearlyDeploymentData[] = Object.entries(
      countsByYear
    )
      .map(([year, count]) => ({
        year: year.toString(),
        "Deployments Per Year": count,
      }))
      .sort((a, b) => Number(a.year) - Number(b.year))

    // Calculate percentage growth for the last two years
    const length = _yearlyDeployment.length
    if (length >= 2) {
      const lastYearDeployment =
        _yearlyDeployment[length - 1]["Deployments Per Year"]
      const secondToLastYearDeployment =
        _yearlyDeployment[length - 2]["Deployments Per Year"]

      const percentageGrowth =
        (lastYearDeployment / secondToLastYearDeployment) * 100
      const wholeNumberPercentageGrowth = Math.round(percentageGrowth)
      setYearlyGrowthRate(wholeNumberPercentageGrowth)
    }

    setYearlyDeployment(_yearlyDeployment)
    console.log("_yearlyDeployment:", _yearlyDeployment)
  }

  const fetchDeploymentGrowthPerMonth = async (sourceData: SourceData[]) => {
    const countsByMonth: Record<string, number> = {}

    sourceData.forEach((data) => {
      data.contracts.forEach((contract) => {
        const date = new Date(Number(contract.blockTimestamp) * 1000)
        const monthYearKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`

        countsByMonth[monthYearKey] = (countsByMonth[monthYearKey] || 0) + 1
      })
    })

    const sortedMonths = Object.keys(countsByMonth).sort()
    const _monthlyGrowthRate: MonthlyGrowthRateData[] = []

    let previousValue = 0
    sortedMonths.forEach((key) => {
      const growthRate = previousValue
        ? ((countsByMonth[key] - previousValue) / previousValue) * 100
        : 0
      _monthlyGrowthRate.push({
        date: key,
        "Growth Percentage": growthRate,
      })
      previousValue = countsByMonth[key]
    })

    setMonthlyGrowthRate(_monthlyGrowthRate)
    console.log("_monthlyGrowthRate:", _monthlyGrowthRate)
  }

  const fetchQueriesByMonth = async (sourceData: SourceData[]) => {
    const countsByMonth: Record<string, number> = {}

    sourceData.forEach((data) => {
      data.contracts.forEach((contract) => {
        const date = new Date(Number(contract.blockTimestamp) * 1000)
        const monthYearKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`

        countsByMonth[monthYearKey] =
          (countsByMonth[monthYearKey] || 0) + Number(contract?.interactions)
      })
    })

    const sortedDates = Object.keys(countsByMonth).sort()
    let _accumulatedTotal = 0
    const _monthlyQueries = [
      { date: "2022-10", "Transactions": 0 },
      ...sortedDates.map((date) => {
        _accumulatedTotal += countsByMonth[date]
        return {
          date,
          "Transactions": _accumulatedTotal,
        }
      }),
    ]

    setMonthlyQueries(_monthlyQueries)
    console.log("_monthlyQueries:", _monthlyQueries)
  }

  const fetchQueriesPerMonth = async (sourceData: SourceData[]) => {
    const countsByMonth: Record<string, number> = {}

    sourceData.forEach((data) => {
      data.contracts.forEach((contract) => {
        const date = new Date(Number(contract.blockTimestamp) * 1000)
        const monthYearKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`

        countsByMonth[monthYearKey] =
          (countsByMonth[monthYearKey] || 0) + Number(contract?.interactions)
      })
    })

    const _monthlyQueries: MonthlyQueriesData[] = Object.keys(countsByMonth)
      .sort()
      .map((key) => ({
        date: key,
        "Transactions": countsByMonth[key],
      }))
  }

  const fetchSrcTxId = async (index: number) => {
    try {
      const srcTxId = srcTxIds[index]
      const _data = await fetchDataByTxId(srcTxId)
      return _data
    } catch (e){
      console.log("fetchSrcTxId", e)
      return e
    }
  }

  
  useEffect(() => {
    if (srcContracts.length > 0) {
      ;(async () => {
        try {
          srcContracts.forEach(async (txId) => {
            console.log("txId", txId)
            const _item = await fetchDataByTxId(txId)
            setSrcData((prevData) => new Map(prevData).set(txId, _item))
            console.log("fetchDataByTxId _item", _item)
          })
        } catch (e) {
          console.log(e)
        }
      })()
    }
  }, [srcContracts])

  useEffect(() => {
    if (srcData.size > 0) {
      const orderedData = srcContracts
        .map((txId) => srcData.get(txId))
        .filter((item) => item !== undefined) as SourceData[]
      console.log("orderedData", orderedData)
      fetchDeployedDatabase(orderedData)
      fetchDeployedDatabase(orderedData)
      fetchTotalQueries(orderedData)
      fetchDeploymentByMonth(orderedData)
      fetchDeploymentPerYear(orderedData)
      fetchQueriesByMonth(orderedData)
      fetchDeploymentGrowthPerMonth(orderedData)
    }
  }, [srcData, srcContracts])

  return (
    <>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-[-1] w-full h-full">
          <Background />
        </div>

        <div className="container mx-auto px-4 dark">
          <Header />

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-col justify-between md:w-1/3">
              {/* Card 1 */}
              <div className="p-4">
                <div>
                  <Card
                    className="max-w-xs mx-auto lg:mb-auto"
                    decoration="top"
                    decorationColor="violet"
                  >
                    <Text>Total Databases Deployed</Text>

                    {totalDeployment ? (
                      <Metric>{totalDeployment.toLocaleString()}</Metric>
                    ) : (
                      <Subtitle>Loading.....</Subtitle>
                    )}
                  </Card>
                </div>
              </div>
              {/* Card 2 */}
              <div className="p-4">
                <div>
                  <Card
                    className="max-w-xs mx-auto lg:mt-auto"
                    decoration="top"
                    decorationColor="violet"
                  >
                    <Text>Total Transactions</Text>

                    {totalQueries ? (
                      <Metric>{totalQueries.toLocaleString()}</Metric>
                    ) : (
                      <Subtitle>Loading.....</Subtitle>
                    )}
                  </Card>
                </div>
              </div>
              {/* Bar Chart 1 */}
              <div className="p-4">
                <div>
                  <Card
                    className="max-w-xs mx-auto"
                    decoration="top"
                    decorationColor="violet"
                  >
                    <Flex justifyContent="between" alignItems="center">
                      <Text>Growth Percentage</Text>
                      {yearlyGrowthRate ? (
                        <BadgeDelta
                          deltaType="moderateIncrease"
                          isIncreasePositive={true}
                          size="xs"
                        >
                          {yearlyGrowthRate?.toLocaleString() + "%"}
                        </BadgeDelta>
                      ) : null}
                    </Flex>
                    {yearlyGrowthRate ? (
                      <Metric>
                        {yearlyGrowthRate?.toLocaleString() + "%"}
                      </Metric>
                    ) : null}

                    <BarChart
                      className="mt-6"
                      data={yearlyDeployment}
                      index="year"
                      categories={["Deployments Per Year"]}
                      colors={["violet"]}
                      valueFormatter={dataFormatter}
                      yAxisWidth={48}
                      noDataText="Fetching Data....."
                    />
                  </Card>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:w-2/3">
              <div className="flex flex-col md:flex-row">
                {/* Line Chart 1 */}
                <div className="p-4 md:w-1/2">
                  <div>
                    <Card>
                      <Title>Cumulative Total Deployment</Title>
                      <LineChart
                        className="mt-6"
                        data={monthlyDeployment}
                        index="date"
                        categories={["Total"]}
                        colors={["emerald"]}
                        valueFormatter={dataFormatter}
                        yAxisWidth={48}
                        noDataText="Fetching Data....."
                      />
                    </Card>
                  </div>
                </div>
                {/* Line Chart 2 */}
                <div className="p-4 md:w-1/2">
                  <div>
                    <Card>
                      <Title>Cumulative Total Transactions</Title>
                      <LineChart
                        className="mt-6"
                        data={monthlyQueries}
                        index="date"
                        categories={["Transactions"]}
                        colors={["emerald"]}
                        valueFormatter={dataFormatter}
                        yAxisWidth={48}
                        noDataText="Fetching Data....."
                      />
                    </Card>
                  </div>
                </div>
              </div>

              {/* Bar Chart 2 */}
              <div className="p-4">
                <div>
                  <Card>
                    <Title>Database Deployments per Contract Version</Title>

                    <BarChart
                      className="mt-6"
                      data={versionDeployment}
                      index="name"
                      categories={["Deployed database count"]}
                      colors={["violet"]}
                      valueFormatter={dataFormatter}
                      yAxisWidth={48}
                      noDataText="Fetching Data....."
                    />
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
