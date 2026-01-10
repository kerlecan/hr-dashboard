"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Voucher = {
  id: string
  voucherNo: string
  date: string
  type: string
  description: string
  debit: number
  credit: number
}

export function FinanceDashboard() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVouchers() {
      try {
        const res = await fetch("/api/vouchers")

        if (!res.ok) {
          throw new Error("Veriler alınamadı")
        }

        const json = await res.json()

        const mapped: Voucher[] = json.data.map(
          (item: any, index: number) => ({
            id: index.toString(),
            voucherNo: `${item.docType}-${item.docNo}`,
            date: new Date(item.docDate).toLocaleDateString("tr-TR"),
            type: item.docType,
            description: item.description || "-",
            debit: Number(item.totalDebit || 0),
            credit: Number(item.totalCredit || 0),
          })
        )

        setVouchers(mapped)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchVouchers()
  }, [])

  if (loading) {
    return <div className="p-10 text-center">Yükleniyor...</div>
  }

  if (error) {
    return <div className="p-10 text-center text-red-500">{error}</div>
  }

  const totalDebit = vouchers.reduce((s, v) => s + v.debit, 0)
  const totalCredit = vouchers.reduce((s, v) => s + v.credit, 0)
  const balance = Math.abs(totalCredit - totalDebit)
  const balanceType = totalCredit > totalDebit ? "Credit Balance" : "Debit Balance"

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Finance Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p>Total Debit</p>
            <p className="text-xl font-semibold">${totalDebit.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p>Total Credit</p>
            <p className="text-xl font-semibold">${totalCredit.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p>Balance</p>
            <p className="text-xl font-semibold">${balance.toLocaleString()}</p>
            <Badge className="mt-2">{balanceType}</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
