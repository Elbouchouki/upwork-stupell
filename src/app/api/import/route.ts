import { NextRequest } from 'next/server';
import { Row } from 'read-excel-file'
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest
) {
  try {
    const body: Row[] = await req.json()
    if (!body) throw new Error("Invalid body")
    if (!body.length) throw new Error("File is empty")
    if (body[0].length !== 2) throw new Error("Invalid file format")
    const d: { sku: string, item: string }[] = body.slice(1).map((item) => ({ sku: item[0].toString(), item: item[1].toString() }))
    await prisma.$transaction([
      prisma.skuItem.deleteMany({}),
      prisma.skuItem.createMany({
        data: d
      })
    ])
    return Response.json({
      message: "File uploaded successfully"
    }, { status: 200 })
  } catch (e: any) {
    return Response.json({ error: e?.message }, {
      status: 500
    })
  }
}