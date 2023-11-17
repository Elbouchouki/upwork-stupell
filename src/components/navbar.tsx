"use client"
import React from 'react'
import { ModeToggle } from '@/components/toggle-theme'
import Link from 'next/link'
import Settings from '@/components/settings'
import { FileCog } from 'lucide-react'

const Navbar = () => {
  return (
    <div className='bg-card h-16 border-b-2 flex flex-row justify-end items-center px-4 gap-3'>
      <Link href='/' className='font-semibold'>
        <div className='flex flex-row gap-2 items-center'>

          <FileCog className='h-8 w-8' />
          <div>
            <div>
              Stupell Industries
            </div>
            <div className='text-xs text-muted-foreground'>
              PDF to Spreadsheet Export Custom Tool
            </div>
          </div>

        </div>
      </Link>
      <div className='ml-auto flex flex-row gap-3'>
        <Settings />
        <ModeToggle />
      </div>
    </div>
  )
}

export default Navbar