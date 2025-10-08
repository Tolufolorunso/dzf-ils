import { NextResponse } from 'next/server'
import { StatusCodes } from 'http-status-codes'
import { dbConnect } from '@/lib/dbConnect'
import Catalog from '@/models/CatalogingModel'
import { delay } from '@/lib/utils'

export async function GET() {
  try {
    await dbConnect()
    await delay(150) // ⏳ optional for UX smoothing

    // 🧭 Find catalog items that have at least one checkout record
    const checkedOutItems = await Catalog.find(
      { 'patronsCheckedOutHistory.0': { $exists: true } },
      'barcode title patronsCheckedOutHistory'
    ).lean()

    if (!checkedOutItems.length) {
      return NextResponse.json(
        {
          status: true,
          message: 'No holds or checked-out items found',
          holds: [],
        },
        { status: StatusCodes.OK }
      )
    }

    // 🧩 Format results
    const formattedHolds = checkedOutItems.flatMap((item) =>
      item.patronsCheckedOutHistory.map((patron) => ({
        itemBarcode: item.barcode,
        title: item.title.mainTitle,
        subtitle: item.title.subtitle || '',
        patronBarcode: patron.barcode,
        patronName: patron.fullname,
        contactNumber: patron.contactNumber || 'No contact number',
        borrowingDate: patron.checkedOutAt || null,
        dueDate: patron.dueDate || null,
        returnedAt: patron.returnedAt || null,
      }))
    )

    return NextResponse.json(
      {
        status: true,
        message: 'Holds fetched successfully ✅',
        holds: formattedHolds,
        total: formattedHolds.length,
      },
      { status: StatusCodes.OK }
    )
  } catch (error) {
    console.error('Error fetching holds:', error)
    return NextResponse.json(
      {
        status: false,
        message: 'Something went wrong while fetching holds',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    )
  }
}
