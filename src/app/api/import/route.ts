import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import { Row } from 'read-excel-file'

export async function POST(
  req: NextRequest
) {
  try {
    const body: Row[] = await req.json()
    if (!body) throw new Error("Invalid body")
    if (!body.length) throw new Error("File is empty")
    if (body[0].length !== 2) throw new Error("Invalid file format")
    await fs.writeFile("skus.txt", body.slice(1).join("\n"))
    return Response.json({
      message: "File uploaded successfully"
    }, { status: 200 })
  } catch (e: any) {
    return Response.json({ error: e?.message }, {
      status: 500
    })
  }
}