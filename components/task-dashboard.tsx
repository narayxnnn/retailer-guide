"use client"

import { useState } from "react"
import useSWR from "swr"
import { Search, User, Settings, ChevronDown, Filter, SortAsc, SortDesc } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { TaskDetailModal } from "@/components/task-detail-modal"
import { AddTaskModal } from "@/components/add-task-modal"
import type { Task } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function TaskDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [dayFilter, setDayFilter] = useState("all")
  const [loadTypeFilter, setLoadTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("retailer")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  const {
    data: tasks = [],
    error,
    mutate,
  } = useSWR<Task[]>(
    `/api/tasks?search=${encodeURIComponent(searchQuery)}&day=${dayFilter}`,
    fetcher,
    { refreshInterval: 30000 }, // Refresh every 30 seconds
  )

  const filteredAndSortedTasks = tasks
    .filter((task) => {
      const matchesLoadType = loadTypeFilter === "all" || task.loadType === loadTypeFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "completed" && task.completed) ||
        (statusFilter === "pending" && !task.completed)
      return matchesLoadType && matchesStatus
    })
    .sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "retailer":
          aValue = a.retailer
          bValue = b.retailer
          break
        case "day":
          aValue = a.day
          bValue = b.day
          break
        case "fileCount":
          aValue = a.fileCount
          bValue = b.fileCount
          break
        case "updatedAt":
          aValue = new Date(a.updatedAt)
          bValue = new Date(b.updatedAt)
          break
        default:
          aValue = a.retailer
          bValue = b.retailer
      }

      if (typeof aValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })

  const handleViewMore = (task: Task) => {
    setSelectedTask(task)
    setIsModalOpen(true)
  }

  const handleTaskSelect = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks)
    if (checked) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredAndSortedTasks.map((task) => task._id!)))
    } else {
      setSelectedTasks(new Set())
    }
  }

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      })
      mutate() // Refresh the data
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error loading tasks</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold">TaskFlow</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search retailers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <AddTaskModal onTaskAdded={() => mutate()} />
            <Badge variant="outline">{selectedTasks.size} selected</Badge>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Enhanced Filters */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={dayFilter} onValueChange={setDayFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Day filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              <SelectItem value="today">Today's load</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
              <SelectItem value="tuesday">Tuesday</SelectItem>
              <SelectItem value="wednesday">Wednesday</SelectItem>
            </SelectContent>
          </Select>

          <Select value={loadTypeFilter} onValueChange={setLoadTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Load type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Load Types</SelectItem>
              <SelectItem value="Direct load">Direct load</SelectItem>
              <SelectItem value="Indirect load">Indirect load</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retailer">Retailer</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="fileCount">File Count</SelectItem>
              <SelectItem value="updatedAt">Last Updated</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={toggleSort}>
            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Task Cards */}
      <div className="p-6">
        {/* Select All Header */}
        <div className="flex items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            checked={selectedTasks.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">Select All ({filteredAndSortedTasks.length} tasks)</span>
          {selectedTasks.size > 0 && (
            <Button variant="outline" size="sm" className="ml-auto bg-transparent">
              Bulk Actions
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {filteredAndSortedTasks.map((task) => (
            <Card key={task._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedTasks.has(task._id!)}
                      onCheckedChange={(checked) => handleTaskSelect(task._id!, checked as boolean)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-semibold text-lg ${task.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {task.retailer}
                        </h3>
                        {task.completed && (
                          <Badge variant="default" className="bg-green-500">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{task.day}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground">
                      {task.formats.xlsx} xlsx, {task.formats.csv} csv, {task.formats.txt} txt, {task.formats.mail} mail
                    </div>

                    <Badge variant={task.loadType === "Direct load" ? "default" : "secondary"}>{task.loadType}</Badge>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTaskComplete(task._id!, !task.completed)}
                      className="text-xs"
                    >
                      {task.completed ? "Mark Pending" : "Mark Complete"}
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleViewMore(task)} className="gap-2">
                      view more
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAndSortedTasks.length === 0 && (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={() => mutate()}
      />
    </div>
  )
}
