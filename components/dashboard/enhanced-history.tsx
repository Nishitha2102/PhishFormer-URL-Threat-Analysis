"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, CheckCircle, Clock, Search, Filter, Download, Trash2 } from "lucide-react"
import useSWR from "swr"

interface ScanRecord {
  _id: string
  url: string
  status: "safe" | "phishing" | "suspicious"
  confidence: number
  timestamp: string
  analysisTime: number
  threats: string[]
}

export function EnhancedHistory() {
  const [scans, setScans] = useState<ScanRecord[]>([])
  const [filteredScans, setFilteredScans] = useState<ScanRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  const fetcher = async (url: string) => {
    const res = await fetch(url, { credentials: "include" })
    if (res.status === 401) {
      // not signed in – show empty history
      return { scans: [] }
    }
    if (!res.ok) throw new Error("Failed to fetch")
    return res.json()
  }

  const { data, isLoading: swrLoading } = useSWR("/api/scans", fetcher, { revalidateOnFocus: false })
  const scansData: ScanRecord[] = data?.scans || []

  useEffect(() => {
    setScans(scansData)
  }, [scansData])

  useEffect(() => {
    fetchScanHistory()
  }, [])

  useEffect(() => {
    filterScans()
  }, [scans, searchTerm, statusFilter])

  const fetchScanHistory = async () => {
    try {
      if (!data) {
        const storedHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]")
        setScans(storedHistory)
      }
    } catch (error) {
      console.error("Failed to load local fallback:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockHistory = (): ScanRecord[] => {
    const mockUrls = [
      "https://secure-bank-login.suspicious-site.com",
      "https://paypal-verification.fake-domain.net",
      "https://google.com",
      "https://github.com",
      "https://amazon-security-alert.phishing-site.org",
    ]

    return mockUrls.map((url, index) => ({
      _id: `mock-${index}`,
      url,
      status:
        url.includes("suspicious") || url.includes("fake") || url.includes("phishing")
          ? Math.random() > 0.5
            ? "phishing"
            : "suspicious"
          : "safe",
      confidence: Math.floor(Math.random() * 30) + 70,
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      analysisTime: Math.floor(Math.random() * 200) + 50,
      threats:
        url.includes("suspicious") || url.includes("fake") || url.includes("phishing")
          ? ["Suspicious domain", "Mimics legitimate site"]
          : [],
    }))
  }

  const filterScans = () => {
    let filtered = scans

    if (searchTerm) {
      filtered = filtered.filter((scan) => scan.url.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    // Coalesce 'suspicious' under 'phishing' for filtering
    if (statusFilter !== "all") {
      if (statusFilter === "phishing") {
        filtered = filtered.filter((scan) => scan.status === "phishing" || scan.status === "suspicious")
      } else if (statusFilter === "safe") {
        filtered = filtered.filter((scan) => scan.status === "safe")
      }
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setFilteredScans(filtered)
  }

  const deleteScan = async (scanId: string) => {
    try {
      console.log("[v0] Deleting scan:", scanId)
      const updatedScans = scans.filter((scan) => scan._id !== scanId)
      setScans(updatedScans)

      localStorage.setItem("scanHistory", JSON.stringify(updatedScans))
    } catch (error) {
      console.error("Failed to delete scan:", error)
    }
  }

  const exportHistory = () => {
    const csvContent = [
      ["URL", "Status", "Confidence", "Timestamp", "Analysis Time", "Threats"].join(","),
      ...filteredScans.map((scan) =>
        [scan.url, scan.status, scan.confidence, scan.timestamp, scan.analysisTime, scan.threats.join("; ")].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "phishformer-scan-history.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-green-400 bg-green-400/10 border-green-400/20"
      case "phishing":
        return "text-red-400 bg-red-400/10 border-red-400/20"
      case "suspicious":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <CheckCircle className="w-4 h-4" />
      case "phishing":
        return <AlertTriangle className="w-4 h-4" />
      case "suspicious":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (isLoading || swrLoading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-muted-foreground">Loading scan history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Scan History</span>
            <div className="flex items-center space-x-2">
              <Button onClick={exportHistory} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardTitle>
          <CardDescription>View and manage your URL scan history ({filteredScans.length} results)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search URLs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {/* Rename filters and remove Suspicious option */}
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="safe">Legitimate</SelectItem>
                <SelectItem value="phishing">Phishing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      <div className="space-y-4">
        {filteredScans.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No scan history found</p>
            </CardContent>
          </Card>
        ) : (
          filteredScans.map((scan) => (
            <Card key={scan._id} className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={getStatusColor(scan.status)}>
                        {getStatusIcon(scan.status)}
                        <span className="ml-1">{scan.status.toUpperCase()}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">{new Date(scan.timestamp).toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">{scan.analysisTime}ms</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm break-all">{scan.url}</p>
                      <p className="text-sm text-muted-foreground">Confidence: {scan.confidence}%</p>
                    </div>
                    {scan.threats.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scan.threats.map((threat, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {threat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteScan(scan._id)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
