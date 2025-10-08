import { NextResponse } from 'next/server'
import { StatusCodes } from 'http-status-codes'
import { dbConnect } from '@/lib/dbConnect'
import Catalog from '@/models/CatalogingModel'
import { delay } from '@/lib/utils'

export async function GET() {
  try {
    await dbConnect()
    await delay(150)

    // Find catalog items that are checked out and overdue
    const checkedOutItems = await Catalog.find(
      {
        isCheckedOut: true,
        'patronsCheckedOutHistory.0': { $exists: true },
      },
      'barcode title patronsCheckedOutHistory'
    ).lean()

    if (!checkedOutItems.length) {
      return NextResponse.json(
        {
          status: true,
          message: 'No overdue items found',
          overdues: [],
        },
        { status: StatusCodes.OK }
      )
    }

    const today = new Date()
    const overdues = []

    // Process each checked out item
    checkedOutItems.forEach((item) => {
      const latestCheckout =
        item.patronsCheckedOutHistory[item.patronsCheckedOutHistory.length - 1]

      // Check if item is overdue (not returned and past due date)
      if (!latestCheckout.returnedAt && latestCheckout.dueDate) {
        const dueDate = new Date(latestCheckout.dueDate)

        if (dueDate < today) {
          overdues.push({
            itemBarcode: item.barcode,
            title: item.title.mainTitle,
            subtitle: item.title.subtitle || '',
            patronBarcode: latestCheckout.barcode,
            patronName: latestCheckout.fullname,
            contactNumber: latestCheckout.contactNumber || 'No contact number',
            borrowingDate: latestCheckout.checkedOutAt || null,
            dueDate: latestCheckout.dueDate || null,
            overdueDays: Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)),
          })
        }
      }
    })

    // Sort by overdue days (most overdue first)
    overdues.sort((a, b) => b.overdueDays - a.overdueDays)

    return NextResponse.json(
      {
        status: true,
        message: 'Overdue items fetched successfully ✅',
        overdues,
        total: overdues.length,
      },
      { status: StatusCodes.OK }
    )
  } catch (error) {
    console.error('Error fetching overdue items:', error)
    return NextResponse.json(
      {
        status: false,
        message: 'Something went wrong while fetching overdue items',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    )
  }
}
