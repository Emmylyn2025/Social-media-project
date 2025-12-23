
import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  content: {
    type: String
  }
})

const uploadSchema = new mongoose.Schema({
  fileSecureUrl: {
    type: String,
    required: true
  },
  filePublicId: {
    type: String,
    required: true
  },
  fileTitle: {
    type: String,
    required: true
  },
  comments: [commentSchema],
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'users'
      }
    }
  ],
  dislike: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
      }
    }
  ],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  }
});

uploadSchema.virtual("likecount").get(function() {
  return this.likes.length;
});

uploadSchema.virtual("dislikecount").get(function() {
  return this.dislike.length;
});

uploadSchema.set("toJSON", {virtuals: true});
uploadSchema.set("toObject", {virtuals: true});

const upload = mongoose.model('uploads', uploadSchema);

export default upload;