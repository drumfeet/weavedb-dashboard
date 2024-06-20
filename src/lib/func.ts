import React from "react"

export const fetchDataByTxId = React.cache(async (srcTxId: string) => {
  const CACHE_EXPIRATION_TIME = 60 * 60 * 1000 // in milliseconds

  try {
    // Check if data is available in local storage
    const cachedItem = localStorage.getItem(srcTxId)
    if (cachedItem) {
      const { data, timestamp } = JSON.parse(cachedItem)

      // Check if the cached data is still fresh
      if (Date.now() - timestamp < CACHE_EXPIRATION_TIME) {
        return data
      }
    }

    // Fetch new data from the API
    const response = await fetch(
      `https://gw.warp.cc/gateway/contracts-by-source?id=${srcTxId}&totalInteractions=true`
    )
    const jsonData = await response.json()

    // Cache the fetched data in local storage with the current timestamp
    localStorage.setItem(
      srcTxId,
      JSON.stringify({ data: jsonData, timestamp: Date.now() })
    )

    return jsonData
  } catch (error) {
    console.error("Error fetching data:", error)
    return null
  }
})

export const dataFormatter = (num: number) => {
    return Intl.NumberFormat("us").format(num).toString()
}