import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { Task } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("taskmanager")

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const day = searchParams.get("day") || "all"

    const filter: any = {}

    if (search) {
      filter.retailer = { $regex: search, $options: "i" }
    }

    if (day !== "all") {
      filter.day = { $regex: day, $options: "i" }
    }

    const tasks = await db.collection<Task>("tasks").find(filter).toArray()

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("taskmanager")

    const taskData = await request.json()
    const task: Omit<Task, "_id"> = {
      ...taskData,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection("tasks").insertOne(task)

    return NextResponse.json({ _id: result.insertedId, ...task })
  } catch (error) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
