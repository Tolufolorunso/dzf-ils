// models/PatronModel.js
const mongoose = require('mongoose');

const PatronSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    middlename: String,
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phoneNumber: String,
    gender: {
      type: String,
      enum: ['male', 'female'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
    },
    dateOfBirth: Date,
    patronType: {
      type: String,
      enum: ['student', 'teacher', 'staff', 'guest'],
      default: 'student',
    },
    barcode: {
      type: String,
      unique: true,
      trim: true,
    },
    registeredDate: {
      type: Date,
      default: Date.now,
    },
    library: {
      type: String,
      required: true,
      default: 'AAoJ',
    },
    active: {
      type: Boolean,
      default: true,
    },
    patronExpiryDate: Date,
    isPatronExpiry: {
      type: Boolean,
      default: false,
    },
    employerInfo: {
      employerName: String,
      schoolName: String,
      schoolAdress: String,
      headOfSchool: String,
      schoolEmail: String,
      schoolPhoneNumber: String,
    },
    studentSchoolInfo: {
      schoolName: String,
      schoolAdress: String,
      headOfSchool: String,
      currentClass: String,
      schoolEmail: String,
      schoolPhoneNumber: String,
    },
    parentInfo: {
      parentName: String,
      parentAddress: String,
      parentPhoneNumber: String,
      relationshipToPatron: String,
      parentEmail: String,
    },
    image_url: {
      secure_url: String,
      public_id: String,
    },
    messagePreferences: {
      type: Array,
      default: ['email'],
    },
    registeredBy: {
      type: String,
      required: true,
      default: 'Admin',
    },
    hasBorrowedBook: {
      type: Boolean,
      default: false,
    },
    points: {
      type: Number,
      default: 0,
    },
    checkoutHistory: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Cataloging',
        },
        checkoutDate: Date,
        dueDate: Date,
      },
    ],
    itemsCheckedOutHistory: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Cataloging',
        },
        itemTitle: String,
        itemSubTitle: String,
        itemBarcode: String,
        checkoutDate: Date,
        dueDate: Date,
        event: {
          type: Boolean,
          default: false,
        },
        eventTitle: String,
      },
    ],
    is18: {
      type: Boolean,
      default: false,
    },
    event: [
      {
        eventTitle: String,
        points: Number,
        eventDate: Date,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Patron || mongoose.model('Patron', PatronSchema);
