import { NextRequest, NextResponse } from 'next/server';

import { extractor } from '@/core/actions';

export async function POST(
  req: NextRequest
) {

  const formData: FormData = await req.formData();
  const type = formData.get('type') as string;
  const file: File = formData.get('file') as File;


  try {
    const data = await extractor(type, file)
    return Response.json({
      type: type,
      data: data
    })
  } catch (e: any) {
    return Response.json({ error: e?.message }, {
      status: 500
    })
  }

  // extractor(type, file).then((d) => {


  // }).catch((e: any) => {

  // })
  // const ross = await extractor(type, file)
  // return Response.jsondata

}