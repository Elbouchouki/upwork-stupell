"ues client"

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { SettingsIcon, UploadCloudIcon } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MultiFileDropzone,
  type FileState,
} from '@/components/multi-dropzone';
import { cn, valideExcelFile } from '@/lib/utils';
import { Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as z from "zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation } from '@tanstack/react-query';
import readXlsxFile from 'read-excel-file'
import { toast } from 'sonner'


const FormSchema = z.object({
  file: z.string().optional(),
})


const Settings = () => {

  const [fileStates, setFileStates] = useState<FileState[]>([]);
  const [canSubmit, setCanSubmit] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  })

  const { mutate } = useMutation(
    {
      mutationFn: ({ data }: { data: any[] }) => fetch('/api/import', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
      onSuccess: async (data, variables, context) => {
        if (!data.ok) {
          updateFileProgress(fileStates[0].key, "ERROR")
          form.setError("file", {
            type: "manuel",
            message: (await data.json())?.error
          })
          setSubmitLoading(false)
          return
        }
        form.reset()
        setFileStates([])
        setSubmitLoading(false)
        toast.success("File uploaded successfully")
        setOpen(false)
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

    if (!valideExcelFile(file.file.type)) {
      updateFileProgress(file.key, "ERROR")
      form.setError("file", {
        type: "manuel",
        message: "File format isn't supported, please choose a pdf file."
      })
      return
    }

    setSubmitLoading(true)
    updateFileProgress(file.key, "COMPLETE")

    const fileBuffer = Buffer.from(await file.file.arrayBuffer());
    const d = await readXlsxFile(fileBuffer)

    mutate({ data: d })
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

    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="outline">
            <SettingsIcon className="h-[1.2rem] w-[1.2rem]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Settings</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DialogTrigger asChild>
            <DropdownMenuItem>
              SKU & Items
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className='text-base'>Adjust SKU and Items</DialogTitle>
          <DialogDescription>
            Upload excel file that contains the SKU and related items
          </DialogDescription>
        </DialogHeader>


        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col gap-4 grow' >
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

            <DialogFooter className='flex flex-row gap-2 justify-end w-full'>
              <Button
                type='reset'
                variant="secondary"
                size="sm"
                disabled={!canSubmit || submitLoading}
                className='flex flex-row gap-1'
                onClick={() => {
                  setFileStates([])
                  form.resetField("file")
                }}>
                Reset
              </Button>

              <Button
                type='submit'
                variant="default"
                size="sm"
                disabled={!canSubmit || submitLoading}
                className='flex flex-row gap-1'>
                <Loader2Icon className={cn('animate-spin w-4 h-4', {
                  'hidden': !submitLoading
                })} />
                <UploadCloudIcon className={cn("w-4 h-4", {
                  "hidden": submitLoading
                })}
                />
                <span>
                  {
                    submitLoading ? "Uploading..." : "Upload"
                  }
                </span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default Settings