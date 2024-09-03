const mongoose = require('mongoose')

const storeSchema = new mongoose.Schema({
    name: {
       type: String
    },
    address: {
        type:String
    },
    info:{
        type:String,
        default:"more info about phone, hours, policies"
    },
    storeId: { type: String, unique: true, required: true }, // Store ID to match with the tracking
    createdAt: { type: Date, default: Date.now },
  });


const storeSchemaModel = mongoose.model("stores", storeSchema);
module.exports = storeSchemaModel;