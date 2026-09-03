const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Note title is required'],
      trim: true,
    },
    body: {
      type: String,
      trim: true,
      default: '',
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    tag: {
      type: String,
      trim: true,
      default: 'Work',
    },
    category: {
      type: String,
      trim: true,
      default: 'Work',
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.body = ret.body || ret.content || '';
        ret.content = ret.body;
        ret.tag = ret.tag || ret.category || 'Work';
        ret.category = ret.tag;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.body = ret.body || ret.content || '';
        ret.content = ret.body;
        ret.tag = ret.tag || ret.category || 'Work';
        ret.category = ret.tag;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('Note', noteSchema);

