import { NextResponse } from 'next/server'
import { StatusCodes } from 'http-status-codes'
import { dbConnect } from '@/lib/dbConnect'
import Patron from '@/models/PatronModel'
import Catalog from '@/models/CatalogingModel'
import { delay } from '@/lib/utils'

export async function POST(request) {
  try {
    await dbConnect()
    await delay(200)

    const body = await request.json()
    const { patronBarcode, itemBarcode, newDueDate } = body

    if (!patronBarcode || !itemBarcode || !newDueDate) {
      return NextResponse.json(
        { status: false, message: 'All fields are required' },
        { status: StatusCodes.BAD_REQUEST }
      )
    }

    // Fetch patron and catalog item
    const [patron, catalogItem] = await Promise.all([
      Patron.findOne({ barcode: patronBarcode }),
      Catalog.findOne({ barcode: itemBarcode }),
    ])

    if (!patron) {
      return NextResponse.json(
        { status: false, message: 'Patron not found' },
        { status: StatusCodes.NOT_FOUND }
      )
    }

    if (!catalogItem) {
      return NextResponse.json(
        { status: false, message: 'Item not found' },
        { status: StatusCodes.NOT_FOUND }
      )
    }

    // Check if the item is currently checked out
    if (!catalogItem.isCheckedOut) {
      return NextResponse.json(
        { status: false, message: 'Item is not checked out' },
        { status: StatusCodes.BAD_REQUEST }
      )
    }

    // Find the latest checkout record
    const latestCheckout =
      catalogItem.patronsCheckedOutHistory[
        catalogItem.patronsCheckedOutHistory.length - 1
      ]

    if (!latestCheckout || latestCheckout.returnedAt) {
      return NextResponse.json(
        { status: false, message: 'Item is not currently checked out' },
        { status: StatusCodes.BAD_REQUEST }
      )
    }

    // Check if the patron matches
    if (latestCheckout.barcode !== patronBarcode) {
      return NextResponse.json(
        { status: false, message: 'Item is not checked out by this patron' },
        { status: StatusCodes.BAD_REQUEST }
      )
    }

    // Update the due date in the catalog item
    latestCheckout.dueDate = new Date(newDueDate)
    latestCheckout.renewedAt = new Date()

    await catalogItem.save()

    // Update patron's checkout history
    const patronCheckoutRecord = patron.itemsCheckedOutHistory.find(
      (item) => item.itemBarcode === itemBarcode && !item.returnedAt
    )

    if (patronCheckoutRecord) {
      patronCheckoutRecord.dueDate = new Date(newDueDate)
      patronCheckoutRecord.renewedAt = new Date()
      await patron.save()
    }

    return NextResponse.json(
      {
        status: true,
        message: 'Item renewed successfully ✅',
        data: {
          itemTitle: catalogItem.title.mainTitle,
          patronName: `${patron.surname}, ${patron.firstname}`,
          newDueDate: new Date(newDueDate).toDateString(),
          renewalDate: new Date().toDateString(),
        },
      },
      { status: StatusCodes.OK }
    )
  } catch (error) {
    console.error('Renewal error:', error)
    return NextResponse.json(
      {
        status: false,
        message: 'Something went wrong during renewal',
        error:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: StatusCodes.INTERNAL_SERVER_ERROR }
    )
  }
}
