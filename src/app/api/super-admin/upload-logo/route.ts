import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "logos")

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json()

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const matches = image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 })
    }

    const mimeType = matches[1]
    const base64Data = matches[2]

    const extension = mimeType.split("/")[1].replace("+xml", "")
    const fileName = `${randomUUID()}.${extension}`

    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    const filePath = path.join(UPLOAD_DIR, fileName)
    await fs.writeFile(filePath, Buffer.from(base64Data, "base64"))

    const publicPath = `/uploads/logos/${fileName}`

    return NextResponse.json({ url: publicPath })
  } catch (error) {
    console.error("Logo upload failed:", error)
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 })
  }
}
