"use client"
import React from 'react'
import { ModeToggle } from '@/components/toggle-theme'
import Link from 'next/link'
import Settings from '@/components/settings'

const Navbar = () => {
  return (
    <div className='bg-card h-12 border-b-2 flex flex-row justify-end items-center px-4 gap-3'>
      <div className='grow'>
        <Link href='/' className='font-semibold hover:underline'>
          Stupell Converter
        </Link>
      </div>
      <Settings />
      <ModeToggle />
    </div>
  )
}

export default Navbar