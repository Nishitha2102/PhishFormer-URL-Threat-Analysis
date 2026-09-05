"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, AlertTriangle, Search, Filter, Calendar, Clock } from "lucide-react"

interface ScanRecord {
  id: string
  url: string
  status: "safe" | "phishing" | "suspicious"
  confidence: number
  timestamp: Date
  analysisTime: number
}

const mockData: ScanRecord[] = [
  {
    id: "1",
    url: "https://legitimate-bank.com",
    status: "safe",
    confidence: 95,
    timestamp: new Date("2024-01-15T10:30:00"),
    analysisTime: 87,
  },
  {
    id: "2",
    url: "https://phishing-site-example.com",
    status: "phishing",
    confidence: 92,
    timestamp: new Date("2024-01-15T09:15:00"),
    analysisTime: 134,
  },
  {
    id: "3",
    url: "https://suspicious-domain.net",
    status: "suspicious",
    confidence: 78,
    timestamp: new Date("2024-01-14T16:45:00"),
    analysisTime: 156,
  },
  {
    id: "4",
    url: "https://trusted-ecommerce.com",
    status: "safe",
    confidence: 98,
    timestamp: new Date("2024-01-14T14:20:00"),
    analysisTime: 92,
  },
  {
    id: "5",
    url: "https://fake-paypal-login.org",
    status: "phishing",
    confidence: 89,
    timestamp: new Date("2024-01-13T11:10:00"),
    analysisTime: 178,
  },
]

export function ScanHistory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [records] = useState<ScanRecord[]>(mockData)

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "safe":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "phishing":
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      case "suspicious":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "text-green-400 border-green-400/50"
      case "phishing":
        return "text-red-400 border-red-400/50"
      case "suspicious":
        return "text-yellow-400 border-yellow-400/50"
      default:
        return "text-muted-foreground"
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-primary" />
          <span>Scan History</span>
        </CardTitle>
        <CardDescription>View and filter your previous URL scans</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search URLs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-input border-border/50"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-input border-border/50">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="safe">Legitimate</SelectItem>
              <SelectItem value="phishing">Phishing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No scans found matching your criteria</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <Card key={record.id} className="border-border/30 bg-background/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(record.status)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{record.url}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(record.timestamp)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{record.analysisTime}ms</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 ml-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{record.confidence}%</div>
                        <div className="text-xs text-muted-foreground">confidence</div>
                      </div>
                      <Badge variant="outline" className={`${getStatusColor(record.status)} text-xs`}>
                        {record.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {filteredRecords.length > 0 && (
          <div className="flex justify-center pt-4">
            <Button variant="outline" className="border-border/50 bg-transparent">
              Load More Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
