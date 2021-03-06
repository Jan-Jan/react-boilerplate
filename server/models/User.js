const mongoose = require('mongoose')
const { generateHash } = require('../middleware/user')

const email = {
  type: String,
  required: true,
  unique: true,
  index: true,
}

const username = {
  type: String,
  required: true,
  unique: true,
  maxlength: 15,
  minlength: 2,
  index: true,
}
const password = {
  type: String,
  required: true,
}

const userSchema = mongoose.Schema({
  email,
  password,
  username,
})

// FIXME: ensure indexing is complete before saving, so that fields can be truly unique
userSchema.pre('save', function userPreSave(next) {
  // FIXME: Can this be moved to setters?
  // FIXME: Also create userSchema.pre('update', ...
  this.email = this.email.toLowerCase()
  this.username = this.username.toLowerCase()
  this.password = generateHash(this.password)
  next()
})

module.exports = mongoose.model('User', userSchema)
