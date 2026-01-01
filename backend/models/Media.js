import mongoose from 'mongoose'

const mediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Media must belong to a user'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the media'],
      trim: true,
      maxlength: [100, 'Title cannot be longer than 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot be longer than 500 characters'],
      default: '',
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    imageUrl: {
      type: String,
      required: [true, 'Please provide an image URL'],
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      validate: {
        validator: function (value) {
          return value <= 5242880 // 5MB in bytes
        },
        message: 'File size cannot exceed 5MB',
      },
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Index for faster queries
mediaSchema.index({ userId: 1, createdAt: -1 })
mediaSchema.index({ tags: 1 })
mediaSchema.index({ isPublic: 1 })

// Populate user details when fetching media
mediaSchema.pre(/^find/, function () {
  this.populate({
    path: 'userId',
    select: 'name email profileImage',
  })
  this.populate({
    path: 'sharedWith',
    select: 'name email profileImage',
  })
})

const Media = mongoose.model('Media', mediaSchema)

export default Media
