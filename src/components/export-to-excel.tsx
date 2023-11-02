"use client"
import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveAs } from "file-saver";
import * as XLSX from 'xlsx';
import { toast } from 'sonner'
type ExportToExcelButtonProps = {
  data: any[]
  fileName: string
  header: string[]
  downloading: boolean
  setDownloading: (downloading: boolean) => void
}

const ExportToExcelButton = ({ data, fileName, downloading, setDownloading }: ExportToExcelButtonProps) => {

  const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
  const fileExtension = ".xlsx";

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

  // async function saveAsExcel() {
  //   setDownloading(true)
  //   try {
  //     const worksheet = XLSX.utils.json_to_sheet(data);
  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  //     const sheet = workbook.Sheets["Sheet1"];
  //     fixWidth(sheet)
  //     let buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  //     XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
  //     XLSX.writeFile(workbook, `${fileName}.xlsx`);
  //   } catch (error) {
  //     console.error(error)
  //   }
  //   setDownloading(false)
  // }

  const exportToCSV = (apiData: any[], fileName: string) => {
    setDownloading(true)
    try {
      const ws = XLSX.utils.json_to_sheet(apiData);
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
      const sheet = wb.Sheets["data"];
      fixWidth(sheet)
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: fileType });
      saveAs(data, fileName + fileExtension);
    } catch (error: any) {
      console.error(error)
      toast.error(
        error.message === "element is null" ? "Something went wrong, check with admin of the website." : error.message
      )
    }
    setDownloading(false)
  };

  return (
    <Button
      type="button"
      onClick={() => {
        console.log(data)
        exportToCSV(data, fileName)
      }}
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
  )
}

export default ExportToExcelButton