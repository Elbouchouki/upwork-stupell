"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx';
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


type ExportButtonProps = {
  data: any[]
  fileName: string
  downloading: boolean
  setDownloading: (downloading: boolean) => void
}

const ExportButton = ({ data, fileName, downloading, setDownloading }: ExportButtonProps) => {

  function fixWidth(worksheet: XLSX.WorkSheet) {
    const data = XLSX.utils.sheet_to_json<any>(worksheet)
    const colLengths = Object.keys(data[0]).map((k) => k.toString().length)
    for (const d of data) {
      Object.values(d).forEach((element: any, index) => {
        const length = element.toString().length
        if (colLengths[index] < length) {
          colLengths[index] = length
        }
      })
    }
    worksheet["!cols"] = colLengths.map((l) => {
      return {
        wch: l + 5,
      }
    })
  }

  const exportToExcel = (apiData: any[], fileName: string) => {
    setDownloading(true)
    try {
      const ws = XLSX.utils.json_to_sheet(apiData);
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
      const sheet = wb.Sheets["data"];
      fixWidth(sheet)
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
      saveAs(data, fileName);
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.message === "element is null" ? "Something went wrong, check with admin of the website." : error.message
      )
    }
    setDownloading(false)
  };

  const exportToCsv = (apiData: any[], fileName: string) => {
    const headers = Object.keys(apiData[0])
    let csvData = headers.join(",") + "\n"
    for (const data of apiData) {
      csvData += Object.values(data).join(",") + "\n"
    }
    const data = new Blob([csvData], { type: "text/csv" });
    saveAs(data, fileName);
  }

  return (

    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button
          type="button"
          // onClick={() => {
          //   exportToExcel(data, fileName)
          // }}
          variant="default"
          size="sm"
          disabled={downloading}
          className='flex flex-row gap-1'>
          <Loader2Icon className={cn('animate-spin w-4 h-4', {
            'hidden': !downloading
          })} />
          <Download className={cn("w-4 h-4", {
            "hidden": downloading
          })}
          />
          <span>
            {
              downloading ? "Downloading..." : "Download"
            }
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
        <DropdownMenuItem
          onClick={() => {
            exportToExcel(data, fileName)
          }}
        >
          Excel format
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            exportToCsv(data, fileName)
          }}
        >
          CSV format
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>


  )
}

export default ExportButton