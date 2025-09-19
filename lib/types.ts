export interface TaskFile {
  downloadName: string
  requiredName: string
}

export interface Task {
  _id?: string
  retailer: string
  day: string
  fileCount: number
  formats: {
    xlsx: number
    csv: number
    txt: number
    mail: number
  }
  loadType: "Direct load" | "Indirect load"
  link: string
  username: string
  password: string
  files: TaskFile[]
  completed: boolean
  createdAt: Date
  updatedAt: Date
}
