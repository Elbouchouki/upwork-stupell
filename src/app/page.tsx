'use client';
import {
  MultiFileDropzone,
  type FileState,
} from '@/components/multi-dropzone';
import { Button } from '@/components/ui/button';
import { cn, validePdfFile } from '@/lib/utils';
import { Loader2Icon, Sheet } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as z from "zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import ExportToExcelButton from '@/components/export-to-excel';
import { useMutation } from '@tanstack/react-query';

const TYPES: [string, ...string[]] = [
  "Ross Stores PO",
  "BHC PO", "OTP PO",
  "Taizhou SC",
  // "HomeSense aka Winners PO",
  "AT HOME PO",
  "Yibai SC",
  "HomeGoods PO",
]

const FormSchema = z.object({
  type: z.enum(TYPES, { required_error: "Please select a file type" }),
  file: z.string().optional(),
})

export default function Home() {

  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [excel, setExcel] = useState({
    data: [],
    fileName: ""
  })
  const [downloading, setDownloading] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const { mutate } = useMutation(
    {
      mutationFn: ({ formData }: { formData: FormData }) => fetch('/api/generator', {
        method: 'POST',
        body: formData
      }),
      onSuccess: async (data, variables, context) => {
        const json = await data.json()
        setExcel({
          data: json.data,
          fileName: `${json.type}-${new Date().getTime()}.xlsx`
        })
        setSubmitLoading(false)
        setGenerated(true)
      },
      onError: async (error, variables, context) => {
        updateFileProgress(fileStates[0].key, "ERROR")
        form.setError("file", {
          type: "manuel",
          message: error.message
        })
        setSubmitLoading(false)
      },


    })

  async function onSubmit(data: z.infer<typeof FormSchema>) {

    const file = fileStates[0];

    if (!validePdfFile(file.file.type)) {
      if (data.type === "AT HOME PO") {
        console.log("file.file.type", file.file.type)
      } else {
        updateFileProgress(file.key, "ERROR")
        form.setError("file", {
          type: "manuel",
          message: "File format isn't supported, please choose a pdf file."
        })
        return
      }
    }
    setSubmitLoading(true)
    updateFileProgress(file.key, "COMPLETE")

    const formData = new FormData()

    formData.append('type', data.type)
    formData.append('file', fileStates[0].file)

    mutate({ formData })
  }

  function updateFileProgress(key: string, progress: FileState['progress']) {
    setFileStates((fileStates) => {
      const newFileStates = structuredClone(fileStates);
      const fileState = newFileStates.find(
        (fileState) => fileState.key === key,
      );
      if (fileState) {
        fileState.progress = progress;
      }
      return newFileStates;
    });
  }


  useEffect(() => {
    setCanSubmit(
      fileStates.length > 0
    )
  }, [fileStates])

  return (
    <main className='h-full w-full p-8' >
      <div className='flex items-center justify-center w-full h-full '>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4 grow max-w-lg bg-card p-8 border-2 shadow-md rounded-lg' >

            <div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {
                          TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="file"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MultiFileDropzone
                        dropzoneOptions={{
                          maxSize: 1024 * 1024 * 10,
                          maxFiles: 1,
                        }}
                        value={fileStates}
                        onChange={(files) => setFileStates(files)}
                        onFilesAdded={(addedFiles) => {
                          setFileStates([...fileStates, ...addedFiles]);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
            <div className='flex flex-row gap-2 justify-end w-full'>
              <Button
                type='reset'
                variant="secondary"
                size="sm"
                disabled={!canSubmit || submitLoading || downloading}
                className='flex flex-row gap-1'
                onClick={() => {
                  setFileStates([])
                  setGenerated(false)
                  form.resetField("file")
                }}>
                Reset
              </Button>
              {generated ?
                <ExportToExcelButton
                  data={excel.data}
                  fileName={excel.fileName}
                  downloading={downloading}
                  setDownloading={setDownloading}
                />
                :
                <Button
                  type='submit'
                  variant="default"
                  size="sm"
                  disabled={!canSubmit || submitLoading}
                  className='flex flex-row gap-1'>
                  <Loader2Icon className={cn('animate-spin w-4 h-4', {
                    'hidden': !submitLoading
                  })} />
                  <Sheet className={cn("w-4 h-4", {
                    "hidden": submitLoading
                  })}
                  />
                  <span>
                    {
                      submitLoading ? "Generating..." : "Generate"
                    }
                  </span>
                </Button>
              }
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
}
