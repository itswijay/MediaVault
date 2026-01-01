import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be longer than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    message: {
      type: String,
      required: [true, 'Please provide a message'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters long'],
      maxlength: [1000, 'Message cannot be longer than 1000 characters'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Optional - for anonymous users
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
contactSchema.index({ userId: 1, createdAt: -1 })
contactSchema.index({ isRead: 1 })
contactSchema.index({ email: 1 })

// Populate user details when fetching contact messages
contactSchema.pre(/^find/, function () {
  if (this.options._recursed) {
    return
  }
  this.populate({
    path: 'userId',
    select: 'name email profileImage',
  })
})

const Contact = mongoose.model('Contact', contactSchema)

export default Contact
